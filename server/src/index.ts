import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Endpoint for generating a JWT token after successful Firebase login
app.post('/api/auth/token', (req: Request, res: Response): void => {
  const { uid, role, username } = req.body;
  if (!uid) {
    res.status(400).json({ error: 'UID is required' });
    return;
  }
  
  const token = jwt.sign({ uid, role, username }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
  res.json({ token });
});

// Endpoint for communicating with AI
app.post('/api/ai/chat', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, systemPrompt } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const promptText = systemPrompt ? `${systemPrompt}\n\nข้อความจากผู้ใช้: ${message}` : message;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    if (!response.ok) {
       res.status(response.status).json({ error: 'Error communicating with AI API' });
       return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Basic endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('LMS API is running securely.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
