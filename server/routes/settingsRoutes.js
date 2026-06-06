import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile',         protect, getProfile);
router.put('/profile',         protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
