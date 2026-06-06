import express from 'express';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeave,
  updateLeaveStatus,
  deleteLeave,
} from '../controllers/leaveController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── IMPORTANT: /my must come BEFORE /:id to avoid conflict ──────
router.get('/my', protect, getMyLeaves);                          // GET    /api/leaves/my

router.get('/', protect, adminOnly, getAllLeaves);                 // GET    /api/leaves
router.post('/', protect, applyLeave);                            // POST   /api/leaves

router.put('/:id', protect, adminOnly, updateLeave);              // PUT    /api/leaves/:id  (full edit)
router.patch('/:id/status', protect, adminOnly, updateLeaveStatus); // PATCH  /api/leaves/:id/status

router.delete('/:id', protect, deleteLeave);                      // DELETE /api/leaves/:id

export default router;
