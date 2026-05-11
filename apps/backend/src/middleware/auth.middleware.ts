import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from './error-handler';
import { logger } from '../utils/logger';

interface JWTPayload {
  userId: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload;
    /**
     * Convenience copy for legacy handlers that read req.userId directly.
     */
    userId?: string;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  void res;
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid token');
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Token expired');
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't reject if missing
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  void res;
  try {
    const authHeader = req.headers.authorization;

    // If no token, just continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // On token error, just continue without setting req.user
    // Don't reject the request
    next();
  }
};

/**
 * Middleware to restrict access to internal services only
 */
export const internalOnly = (req: Request, res: Response, next: NextFunction) => {
  void res;
  const internalToken = req.headers['x-internal-token'];
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    logger.error('INTERNAL_API_SECRET is not defined');
    return next(new AppError(500, 'Internal server error'));
  }

  if (typeof internalToken !== 'string') {
    return next(new AppError(401, 'Unauthorized internal request'));
  }

  try {
    const internalTokenBuffer = Buffer.from(internalToken);
    const secretBuffer = Buffer.from(secret);

    if (
      internalTokenBuffer.length !== secretBuffer.length ||
      !crypto.timingSafeEqual(internalTokenBuffer, secretBuffer)
    ) {
      return next(new AppError(401, 'Unauthorized internal request'));
    }
  } catch (error) {
    return next(new AppError(401, 'Unauthorized internal request'));
  }

  next();
};
