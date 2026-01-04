import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

interface JWTPayload {
  userId: string;
  email: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload;
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
      // Try to decode as JWT first
      const decoded = jwt.verify(token, secret) as JWTPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      // If JWT verification fails, try to parse as a simple base64-encoded user payload.
      // TODO: Remove this fallback once NextAuth starts issuing proper JWT access tokens everywhere.
      try {
        const decodedPayload = Buffer.from(token, 'base64').toString('utf-8');
        const decoded = JSON.parse(decodedPayload) as { userId: string; email: string };
        if (decoded.userId && decoded.email) {
          req.user = {
            userId: decoded.userId,
            email: decoded.email,
          };
          next();
        } else {
          throw new AppError(401, 'Invalid token format');
        }
      } catch {
        // Re-throw original JWT error
        if (jwtError instanceof jwt.JsonWebTokenError) {
          throw new AppError(401, 'Invalid token');
        } else if (jwtError instanceof jwt.TokenExpiredError) {
          throw new AppError(401, 'Token expired');
        } else {
          throw jwtError;
        }
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
    next();
  } catch (error) {
    // On token error, just continue without setting req.user
    // Don't reject the request
    next();
  }
};
