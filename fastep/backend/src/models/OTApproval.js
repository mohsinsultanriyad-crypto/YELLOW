import mongoose from 'mongoose';

const otApprovalSchema = new mongoose.Schema({
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  supervisorApproved: { type: Boolean, default: false },
  adminApproved: { type: Boolean, default: false },
  editedBy: String,
  editedFrom: Object,
  editedTo: Object,
  timestamps: { type: Date, default: Date.now },
  history: [
    {
      editedBy: String,
      editedFrom: Object,
      editedTo: Object,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model('OTApproval', otApprovalSchema);
