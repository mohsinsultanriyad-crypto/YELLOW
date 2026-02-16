import mongoose from 'mongoose';

const advanceSchema = new mongoose.Schema({
  workerId: { type: String, required: true },
  amount: { type: Number, required: true },
  requestDate: { type: String, required: true },
  status: { type: String, enum: ['requested', 'scheduled', 'confirmed', 'deducted'], default: 'requested' },
  scheduledPayments: [{ date: String, amount: Number }],
  confirmedPayments: [{ date: String, amount: Number }],
  linkedToSalary: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Advance', advanceSchema);
