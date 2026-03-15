/**
 * Authentication middleware.
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

/**
 * Middleware to verify JWT token and attach user to request.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ detail: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

/**
 * Optional authentication - doesn't fail if no token provided.
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

export default authenticate;
