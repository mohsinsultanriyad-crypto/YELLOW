import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: { type: Object, required: true },
  generatedBy: String,
  generatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);
