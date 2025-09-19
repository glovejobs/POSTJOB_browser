import { Router } from 'express';
import authService from '../../services/auth.service';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign up with Supabase Auth
    const { user, session } = await authService.signUp(email, password, { full_name: fullName });

    if (!user) {
      return res.status(400).json({ error: 'Registration failed' });
    }

    // Create user profile with API key
    const profile = await authService.createOrUpdateUserProfile(user);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name
      },
      session: {
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
        expires_at: session?.expires_at
      },
      apiKey: profile.api_key,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.message?.includes('User already registered')) {
      return res.status(400).json({ error: 'User already exists' });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in with Supabase Auth
    const { user, session } = await authService.signIn(email, password);

    if (!user || !session) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get or create user profile
    const profile = await authService.createOrUpdateUserProfile(user);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      },
      apiKey: profile.api_key,
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message?.includes('Invalid login credentials')) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.signOut(token);
    }

    return res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res): Promise<any> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { session } = await authService.refreshToken(refresh_token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    return res.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await authService.resetPassword(email);

    return res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    // Don't reveal if email exists or not
    return res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res): Promise<any> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    await authService.updatePassword(token, password);

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return res.status(400).json({ error: 'Failed to update password' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const profile = await authService.getUserProfile(req.user.id);

    return res.json({
      id: req.user.id,
      email: req.user.email,
      fullName: profile?.full_name,
      apiKey: profile?.api_key,
      stripeCustomerId: profile?.stripe_customer_id,
      createdAt: profile?.created_at,
      updatedAt: profile?.updated_at
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { fullName } = req.body;
    const updates: any = {};

    if (fullName !== undefined) {
      updates.full_name = fullName;
    }

    updates.updated_at = new Date().toISOString();

    const profile = await authService.updateUserProfile(req.user.id, updates);

    return res.json({
      id: req.user.id,
      email: req.user.email,
      fullName: profile.full_name,
      updatedAt: profile.updated_at
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;