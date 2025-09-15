import { Router } from 'express';
import prisma from '../../database/prisma';
import { generateApiKey } from '../../utils/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Generate API key
    const apiKey = generateApiKey();
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        apiKey
      }
    });
    
    return res.status(201).json({
      id: user.id,
      email: user.email,
      apiKey, // Return the plain API key only once
      message: 'Save this API key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res): Promise<any> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;