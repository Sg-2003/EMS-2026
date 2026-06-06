import express from 'express';
import {
  markAttendance,
  bulkMarkAttendance,
  getAllAttendance,
  getMyAttendance,
  getTodayAttendance,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Must come before /:id ────────────────────────────────────────
router.get('/my',    protect, getMyAttendance);               // GET  /api/attendance/my
router.get('/today', protect, adminOnly, getTodayAttendance); // GET  /api/attendance/today

// ── Admin CRUD ───────────────────────────────────────────────────
router.get('/',         protect, adminOnly, getAllAttendance);    // GET  /api/attendance
router.post('/',        protect, adminOnly, markAttendance);      // POST /api/attendance
router.post('/bulk',    protect, adminOnly, bulkMarkAttendance);  // POST /api/attendance/bulk
router.put('/:id',      protect, adminOnly, updateAttendance);    // PUT  /api/attendance/:id
router.delete('/:id',   protect, adminOnly, deleteAttendance);    // DELETE /api/attendance/:id

export default router;
