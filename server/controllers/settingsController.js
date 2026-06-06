import User   from '../models/User.js';
import bcrypt from 'bcrypt';

// ── GET /api/settings/profile ────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/settings/profile ────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, department, position } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name)       user.name       = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (bio   !== undefined) user.bio   = bio;
    // Employees can update department/position only if admin (guard in frontend)
    if (department !== undefined && req.user.role === 'admin') user.department = department;
    if (position   !== undefined && req.user.role === 'admin') user.position   = position;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    return res.status(200).json({ success: true, data: updated, message: 'Profile updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/settings/change-password ────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
