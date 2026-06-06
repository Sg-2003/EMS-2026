import express from 'express';
import { getAdminStats, getMyStats } from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats',    protect, adminOnly, getAdminStats);
router.get('/my-stats', protect, getMyStats);

export default router;
