import { Router } from 'express';
import db from '../../services/database.service';
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
    const existingUser = await db.user.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Generate API key
    const apiKey = generateApiKey();
    
    // Create user
    const user = await db.user.create({
      email,
      apiKey
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

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await db.user.findByEmail(email);

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // In a real app, we'd use proper authentication here
    // For MVP, we'll return the existing API key
    return res.json({
      id: user.id,
      email: user.email,
      apiKey: user.api_key,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res): Promise<any> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    const user = await db.user.findByApiKey(apiKey);
    
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