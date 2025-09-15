import { Router } from 'express';
import prisma from '../../database/prisma';

const router = Router();

// GET /api/boards - List all available job boards
router.get('/', async (_req, res) => {
  try {
    const boards = await prisma.jobBoard.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        enabled: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch job boards' });
  }
});

// GET /api/boards/:id - Get specific board details
router.get('/:id', async (req, res) => {
  try {
    const board = await prisma.jobBoard.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        enabled: true
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    return res.status(500).json({ error: 'Failed to fetch job board' });
  }
});

export default router;