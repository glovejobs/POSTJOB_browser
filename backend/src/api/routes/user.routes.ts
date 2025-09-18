import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { emailService } from '../../services/email.service';
import db from '../../services/database.service';
import supabase from '../../database/supabase';

const router = Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await db.user.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get job count
    const { count: jobCount } = await supabase
      .from('postjob_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Format response
    const profile = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      company: user.company,
      phone: user.phone,
      website: user.website,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.created_at,
      jobCount: jobCount || 0,
      emailPreferences: user.email_preferences || {
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
      const existingUser = await db.user.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    const updatedUser = await db.user.update(userId, {
      name,
      email,
      company,
      phone,
      website,
      bio
    });

    // Format response to match expected field names
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      company: updatedUser.company,
      phone: updatedUser.phone,
      website: updatedUser.website,
      bio: updatedUser.bio
    };

    return res.json({
      message: 'Profile updated successfully',
      user: formattedUser
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
    const user = await db.user.findById(userId);

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
    await db.user.update(userId, { password: hashedPassword });

    // Send confirmation email
    try {
      if (user.email) {
        await emailService.sendPasswordChangedEmail(user.email, user.full_name || 'User');
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
    await db.user.update(userId, {
      emailPreferences: preferences
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
    await db.user.update(userId, { avatar });

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
    const user = await db.user.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Delete user and all related data (cascade delete in Supabase handles relations)
    const { error } = await supabase
      .from('postjob_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    // Send farewell email
    try {
      if (user.email) {
        await emailService.sendAccountDeletedEmail(user.email, user.full_name || 'User');
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

    // Get job statistics
    const { data: allJobs } = await supabase
      .from('postjob_jobs')
      .select('status')
      .eq('user_id', userId);

    const jobStats = (allJobs || []).reduce((acc: any, job: any) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('postjob_jobs')
      .select('id, title, company, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const formattedRecentActivity = (recentActivity || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      status: job.status,
      createdAt: job.created_at
    }));

    // Calculate totals
    const totalJobs = Object.values(jobStats).reduce((acc: number, count: any) => acc + count, 0);
    const stats = {
      totalJobs,
      draftJobs: jobStats.draft || 0,
      publishedJobs: jobStats.completed || 0,
      pendingJobs: jobStats.pending || 0,
      recentActivity: formattedRecentActivity
    };

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;