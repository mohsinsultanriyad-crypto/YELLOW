import mongoose from 'mongoose';

const editHistorySchema = new mongoose.Schema({
  editedBy: String,
  editedFrom: Object,
  editedTo: Object,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  workerId: { type: String, required: true },
  date: { type: String, required: true },
  inTime: String,
  outTime: String,
  lunch: String,
  totalHours: Number,
  baseHours: Number,
  overtime: Number,
  status: { type: String, enum: ['pending', 'supervisor-approved', 'admin-approved', 'billable'], default: 'pending' },
  supervisorId: String,
  editHistory: [editHistorySchema]
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
