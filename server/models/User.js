import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  // Employee specific fields
  phone: { type: String, trim: true },
  joinDate: { type: Date },
  bio: { type: String },
  department: { type: String },
  position: { type: String },
  basicSalary: { type: Number },
  allowances: { type: Number },
  deductions: { type: Number },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
