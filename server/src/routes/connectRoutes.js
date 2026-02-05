import express from 'express';
import { saveConnectRequest } from '../services/db.js';

const router = express.Router();

// POST /api/connect
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, type } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Save to DB
    const result = await saveConnectRequest({ 
      name, 
      email, 
      subject: subject || 'No Subject', 
      message, 
      type: type || 'general' 
    });

    res.status(201).json({ 
      message: 'Request submitted successfully', 
      requestId: result.id 
    });

  } catch (error) {
    console.error('[Connect API] Error processing request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

export default router;
