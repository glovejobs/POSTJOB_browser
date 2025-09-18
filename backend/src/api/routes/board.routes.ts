import { Router } from 'express';
import db from '../../services/database.service';

const router = Router();

// GET /api/boards - List all available job boards
router.get('/', async (_req, res) => {
  try {
    const boards = await db.jobBoard.findAll(true);

    // Filter only required fields
    const filteredBoards = boards.map(board => ({
      id: board.id,
      name: board.name,
      enabled: board.enabled
    }));
    
    res.json(filteredBoards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch job boards' });
  }
});

// GET /api/boards/:id - Get specific board details
router.get('/:id', async (req, res) => {
  try {
    const board = await db.jobBoard.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Filter only required fields
    const filteredBoard = {
      id: board.id,
      name: board.name,
      baseUrl: board.base_url,
      enabled: board.enabled
    };

    return res.json(filteredBoard);
  } catch (error) {
    console.error('Error fetching board:', error);
    return res.status(500).json({ error: 'Failed to fetch job board' });
  }
});

export default router;