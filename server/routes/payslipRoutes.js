import express from 'express';
import {
  createPayslip,
  getAllPayslips,
  getMyPayslips,
  getPayslipById,
  updatePayslip,
  deletePayslip,
  generateMonthlyPayslips,
} from '../controllers/payslipController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Employee routes — MUST come before /:id
router.get('/my', protect, getMyPayslips);                              // GET  /api/payslips/my

// Admin bulk generate
router.post('/generate', protect, adminOnly, generateMonthlyPayslips); // POST /api/payslips/generate

// Admin CRUD
router.get('/',    protect, adminOnly, getAllPayslips);                  // GET  /api/payslips
router.post('/',   protect, adminOnly, createPayslip);                  // POST /api/payslips

// Both (owner check inside controller)
router.get('/:id',    protect, getPayslipById);                         // GET    /api/payslips/:id
router.put('/:id',    protect, adminOnly, updatePayslip);               // PUT    /api/payslips/:id
router.delete('/:id', protect, adminOnly, deletePayslip);               // DELETE /api/payslips/:id

export default router;
