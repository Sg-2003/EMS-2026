import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
    default: 'Present',
  },
  checkIn:  { type: String }, // "09:00"
  checkOut: { type: String }, // "18:00"
  workHours:{ type: Number, default: 0 },
  note:     { type: String, trim: true },
}, { timestamps: true });

// One record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
