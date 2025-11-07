import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  return jwt.sign(
    { userId, email } as Record<string, unknown>,
    secret as jwt.Secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    } as jwt.SignOptions
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');

  return jwt.sign(
    { userId, email } as Record<string, unknown>,
    secret as jwt.Secret,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions
  );
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { email, username, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError(409, 'Email already registered');
      }
      throw new AppError(409, 'Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const { refreshToken: token } = refreshTokenSchema.parse(req.body);

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');

    // Verify refresh token
    const decoded = jwt.verify(token, secret as jwt.Secret) as { userId: string; email: string };

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId, decoded.email);

    res.json({
      accessToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid refresh token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Refresh token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * @route   POST /api/v1/auth/token
 * @desc    Get backend JWT token for NextAuth authenticated users
 * @access  Public
 */
export const getTokenForNextAuthUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Generate tokens for this user
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    logger.info('Backend token generated for NextAuth user', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Token generated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};
