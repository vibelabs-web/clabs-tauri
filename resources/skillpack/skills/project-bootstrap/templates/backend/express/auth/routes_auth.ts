/**
 * Authentication routes.
 */
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { authenticate } from '../middleware/auth';
import type { RegisterRequest, LoginRequest, PasswordChangeRequest } from '../types/auth';

const router = Router();

/**
 * POST /auth/register - Register a new user.
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data: RegisterRequest = req.body;

    // Validate input
    if (!data.email || !data.password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }

    // Check if email already exists
    const existing = await authService.findByEmail(data.email);
    if (existing) {
      res.status(400).json({ detail: 'Email already registered' });
      return;
    }

    // Create user
    const user = await authService.createUser(data);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /auth/login - Login and get access token.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data: LoginRequest = req.body;

    // Validate input
    if (!data.email || !data.password) {
      res.status(400).json({ detail: 'Email and password are required' });
      return;
    }

    // Authenticate user
    const user = await authService.authenticate(data.email, data.password);
    if (!user) {
      res.status(401).json({ detail: 'Incorrect email or password' });
      return;
    }

    // Create token
    const token = authService.createToken({ id: user.id, email: user.email });

    res.json({
      accessToken: token,
      tokenType: 'bearer',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /auth/logout - Logout current user.
 */
router.post('/logout', authenticate, (req: Request, res: Response) => {
  // For stateless JWT, just return success
  // Implement token blacklist for true logout
  res.json({ message: 'Successfully logged out' });
});

/**
 * POST /auth/password/change - Change current user's password.
 */
router.post('/password/change', authenticate, async (req: Request, res: Response) => {
  try {
    const data: PasswordChangeRequest = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!data.currentPassword || !data.newPassword) {
      res.status(400).json({ detail: 'Current password and new password are required' });
      return;
    }

    // Get user
    const user = await authService.findById(userId);
    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }

    // Verify current password
    const isValid = await authService.verifyPassword(data.currentPassword, user.password);
    if (!isValid) {
      res.status(400).json({ detail: 'Incorrect current password' });
      return;
    }

    // Update password
    await authService.updatePassword(userId, data.newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
