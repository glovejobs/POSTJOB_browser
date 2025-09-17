import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../database/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { emailService } from '../../services/email.service';

const router = Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        website: true,
        bio: true,
        avatar: true,
        emailPreferences: true,
        createdAt: true,
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format response
    const profile = {
      ...user,
      jobCount: user._count.jobs,
      emailPreferences: user.emailPreferences || {
        jobUpdates: true,
        weeklyDigest: true,
        marketing: false,
        applications: true
      }
    };

    return res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, email, company, phone, website, bio } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user!.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        company,
        phone,
        website,
        bio
      },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        phone: true,
        website: true,
        bio: true
      }
    });

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/users/password - Change password
router.put('/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Send confirmation email
    try {
      if (user.email) {
        await emailService.sendPasswordChangedEmail(user.email, user.name || 'User');
      }
    } catch (emailError) {
      console.error('Failed to send password change email:', emailError);
    }

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// PUT /api/users/email-preferences - Update email preferences
router.put('/email-preferences', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    // Validate preferences structure
    const validKeys = ['jobUpdates', 'weeklyDigest', 'marketing', 'applications'];
    const isValid = Object.keys(preferences).every(key => validKeys.includes(key));

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid preferences structure' });
    }

    // Update preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailPreferences: preferences
      }
    });

    return res.json({
      message: 'Email preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// POST /api/users/avatar - Upload avatar
router.post('/avatar', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { avatar } = req.body; // Base64 image or URL

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
    }

    // Update avatar
    await prisma.user.update({
      where: { id: userId },
      data: { avatar }
    });

    return res.json({
      message: 'Avatar updated successfully',
      avatar
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// DELETE /api/users/account - Delete account
router.delete('/account', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;

    // Require password confirmation for account deletion
    if (!password) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Delete user and all related data (cascade delete)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Send farewell email
    try {
      if (user.email) {
        await emailService.sendAccountDeletedEmail(user.email, user.name || 'User');
      }
    } catch (emailError) {
      console.error('Failed to send account deletion email:', emailError);
    }

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get various statistics
    const [jobStats, recentActivity] = await Promise.all([
      // Job statistics
      prisma.job.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),
      // Recent activity
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    // Calculate totals
    const stats = {
      totalJobs: jobStats.reduce((acc: number, stat: any) => acc + stat._count, 0),
      draftJobs: jobStats.find((s: any) => s.status === 'draft')?._count || 0,
      publishedJobs: jobStats.find((s: any) => s.status === 'completed')?._count || 0,
      pendingJobs: jobStats.find((s: any) => s.status === 'pending')?._count || 0,
      recentActivity
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;