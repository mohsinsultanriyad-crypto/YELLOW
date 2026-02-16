import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/error.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import shiftRoutes from './routes/shifts.js';
import leaveRoutes from './routes/leaves.js';
import advanceRoutes from './routes/advances.js';
import postRoutes from './routes/posts.js';
import announcementRoutes from './routes/announcements.js';

// Load env vars
dotenv.config();

const app = express();

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));


app.use('/api', authRoutes); // /api/login
app.use('/api/users', userRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/announcements', announcementRoutes);

// Error handler
app.use(errorHandler);

export default app;
