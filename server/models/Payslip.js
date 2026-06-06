import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: { type: Number, required: true, min: 1, max: 12 },
  year:  { type: Number, required: true, min: 2000 },
  basicSalary:  { type: Number, required: true, default: 0 },
  allowances:   { type: Number, default: 0 },
  deductions:   { type: Number, default: 0 },
  bonus:        { type: Number, default: 0 },
  netSalary:    { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Paid'],
    default: 'Draft',
  },
  paidOn: { type: Date },
  notes:  { type: String, trim: true },
}, { timestamps: true });

// Compute netSalary before every save (Mongoose v8 async middleware)
payslipSchema.pre('save', async function() {
  this.netSalary =
    (this.basicSalary || 0) +
    (this.allowances  || 0) +
    (this.bonus       || 0) -
    (this.deductions  || 0);

  if (this.status === 'Paid' && !this.paidOn) {
    this.paidOn = new Date();
  }
});

// Unique payslip per employee per month/year
payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Payslip', payslipSchema);
