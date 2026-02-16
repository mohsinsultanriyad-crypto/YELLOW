import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  startTime: String,
  endTime: String,
  breakHours: Number,
  totalHours: Number,
  otHours: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  notes: String,
});

export default mongoose.model('Shift', shiftSchema);
