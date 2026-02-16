import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  authorId: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Announcement', announcementSchema);
