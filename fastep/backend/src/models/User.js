import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // e.g. FSA101, FS1001
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'worker', 'supervisor'], required: true },
  trade: { type: String },
  salary: { type: Number },
  phone: { type: String },
  documents: { type: Array, default: [] },
  expiryDates: { type: Array, default: [] },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
