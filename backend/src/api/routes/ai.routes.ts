import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import aiService, { JobDescriptionParams } from '../../services/ai.service';

const router = Router();

// POST /api/ai/generate-description
router.post('/generate-description', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const params: JobDescriptionParams = req.body;

    if (!params.title || !params.company || !params.location) {
      return res.status(400).json({
        error: 'Missing required fields: title, company, and location are required'
      });
    }

    const description = await aiService.generateJobDescription(params);

    return res.json({ description });
  } catch (error: any) {
    console.error('AI generation error:', error);

    if (error.message === 'AI service not configured') {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    return res.status(500).json({ error: 'Failed to generate job description' });
  }
});

// POST /api/ai/generate-description-stream
router.post('/generate-description-stream', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const params: JobDescriptionParams = req.body;

    if (!params.title || !params.company || !params.location) {
      return res.status(400).json({
        error: 'Missing required fields: title, company, and location are required'
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection
    res.write('data: {"type":"connected"}\n\n');

    try {
      const stream = aiService.streamJobDescription(params);

      for await (const chunk of stream) {
        // Send each chunk as SSE
        const data = JSON.stringify({ type: 'content', content: chunk });
        res.write(`data: ${data}\n\n`);
      }

      // Send completion event
      res.write('data: {"type":"done"}\n\n');
      res.end();
    } catch (streamError: any) {
      console.error('Stream error:', streamError.message || streamError);

      // Send error as SSE event
      const errorMessage = streamError.message || 'Failed to generate description';
      const errorData = JSON.stringify({
        type: 'error',
        error: errorMessage
      });

      // Make sure headers are sent for SSE
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }

      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('AI stream error:', error);

    if (!res.headersSent) {
      if (error.message === 'AI service not configured') {
        return res.status(503).json({ error: 'AI service is not available' });
      }
      return res.status(500).json({ error: 'Failed to stream job description' });
    }
  }
});

// POST /api/ai/improve-description
router.post('/improve-description', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { description, feedback } = req.body;

    if (!description || !feedback) {
      return res.status(400).json({
        error: 'Both description and feedback are required'
      });
    }

    const improvedDescription = await aiService.improveJobDescription(description, feedback);

    return res.json({ description: improvedDescription });
  } catch (error: any) {
    console.error('AI improvement error:', error);

    if (error.message === 'AI service not configured') {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    return res.status(500).json({ error: 'Failed to improve job description' });
  }
});

// POST /api/ai/suggest-titles
router.post('/suggest-titles', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        error: 'Description is required to suggest titles'
      });
    }

    const titles = await aiService.generateJobTitle(description);

    return res.json({ titles });
  } catch (error: any) {
    console.error('AI title suggestion error:', error);

    if (error.message === 'AI service not configured') {
      return res.status(503).json({ error: 'AI service is not available' });
    }

    return res.status(500).json({ error: 'Failed to suggest job titles' });
  }
});

// GET /api/ai/templates
router.get('/templates', authenticate, async (_req: AuthRequest, res): Promise<any> => {
  try {
    const templates = aiService.getJobTemplates();
    return res.json({ templates });
  } catch (error) {
    console.error('Template fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/ai/status
router.get('/status', async (_req, res): Promise<any> => {
  try {
    const isConfigured = !!process.env.OPENROUTER_API_KEY;
    return res.json({
      available: isConfigured,
      provider: 'OpenRouter',
      model: 'deepseek/deepseek-chat-v3-0324:free',
      features: isConfigured ? [
        'generate-description',
        'stream-description',
        'improve-description',
        'suggest-titles',
        'templates'
      ] : []
    });
  } catch (error) {
    console.error('AI status error:', error);
    return res.status(500).json({ error: 'Failed to check AI status' });
  }
});

export default router;