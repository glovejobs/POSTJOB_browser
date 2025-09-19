import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import db from '../services/database.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    apiKey?: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Check for Bearer token first (Supabase Auth)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const user = await authService.verifyToken(token);
      if (user) {
        // Get user profile with API key
        const profile = await authService.getUserProfile(user.id);

        req.user = {
          id: user.id,
          email: user.email!,
          apiKey: profile?.api_key
        };

        return next();
      }
    }

    // Fallback to API key authentication for backward compatibility
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const user = await db.user.findByApiKey(apiKey);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          apiKey: apiKey
        };

        return next();
      }
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional authentication - doesn't fail if no auth provided
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const user = await authService.verifyToken(token);
      if (user) {
        const profile = await authService.getUserProfile(user.id);

        req.user = {
          id: user.id,
          email: user.email!,
          apiKey: profile?.api_key
        };
      }
    } else {
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) {
        const user = await db.user.findByApiKey(apiKey);

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
            apiKey: apiKey
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}