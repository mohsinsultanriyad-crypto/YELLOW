import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'approved_with_deduction', 'cancelled_by_worker'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
});

export default mongoose.model('Leave', leaveSchema);
