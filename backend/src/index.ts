import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db';
import { verifyConnection } from './emailService';
import emailRoutes from './routes/emails';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log sanitized error (not full stack trace in production)
  console.error('Server error:', err.message);
  
  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Verify SMTP connection
    await verifyConnection();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
