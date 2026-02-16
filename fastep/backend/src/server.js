import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

const PORT = process.env.PORT || 4000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import advanceRoutes from './routes/advance.js';
import leaveRoutes from './routes/leave.js';
import announcementRoutes from './routes/announcement.js';
import salaryRoutes from './routes/salary.js';
import reportRoutes from './routes/report.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advance', advanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/report', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
