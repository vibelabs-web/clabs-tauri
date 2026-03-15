/**
 * User routes.
 */
import { Router, Request, Response } from 'express';
import { authService } from '../services/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /users/me - Get current user's profile.
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await authService.findById(req.user!.id);

    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * PATCH /users/me - Update current user's profile.
 */
router.patch('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const user = await authService.updateUser(req.user!.id, { name });

    if (!user) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * DELETE /users/me - Delete current user's account (soft delete).
 */
router.delete('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const success = await authService.deactivateUser(req.user!.id);

    if (!success) {
      res.status(404).json({ detail: 'User not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
