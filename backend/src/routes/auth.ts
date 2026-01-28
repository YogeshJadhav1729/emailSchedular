import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Please configure it in your .env file.');
}

/**
 * Mock Google OAuth callback (for demo purposes)
 * In production, use passport-google-oauth20
 * POST /api/auth/google
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!googleId) {
      return res.status(400).json({ error: 'Google ID is required for authentication' });
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name,
        avatar,
        googleId,
      },
      update: {
        name,
        avatar,
        googleId,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error: any) {
    console.error('Error in Google auth:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify JWT token
 * GET /api/auth/verify
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * Get user profile
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
