import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  workerId: { type: String, required: true },
  type: { type: String, required: true },
  reason: String,
  status: { type: String, enum: ['requested', 'proposed', 'accepted', 'declined', 'finalized'], default: 'requested' },
  adminProposedDeduction: Number,
  workerResponse: { type: String, enum: ['accepted', 'declined', null], default: null },
  finalDeduction: Number,
}, { timestamps: true });

export default mongoose.model('Leave', leaveSchema);
