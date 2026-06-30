import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Token is invalid or expired' });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing' });
  }
};

app.post('/api/auth/token', (req: Request, res: Response): void => {
  const { uid, role, username } = req.body;
  if (!uid) {
    res.status(400).json({ error: 'UID is required' });
    return;
  }
  const token = jwt.sign({ uid, role, username }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
  res.json({ token });
});

app.post('/api/ai/chat', authenticateJWT, async (req: any, res: Response): Promise<void> => {
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

// For local testing if needed, though Netlify takes care of mapping
app.get('/api', (req, res) => {
  res.json({ message: 'Netlify LMS API is running.' });
});

export const handler = serverless(app);
