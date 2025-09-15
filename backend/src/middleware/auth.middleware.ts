import { Request, Response, NextFunction } from 'express';
import prisma from '../database/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { apiKey }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    req.user = {
      id: user.id,
      email: user.email
    };

    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}