import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);

router.get('/seed', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const bcrypt = (await import('bcrypt')).default;

    const adminExists = await User.findOne({ email: 'admin@example.com' });
    let adminMsg = 'Admin already exists';
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      adminMsg = 'Admin created: admin@example.com / admin123';
    }

    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    let empMsg = 'Employee already exists';
    if (!employeeExists) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      const employeeUser = new User({
        name: 'John Doe',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'employee'
      });
      await employeeUser.save();
      empMsg = 'Employee created: employee@example.com / employee123';
    }

    res.status(200).json({ success: true, admin: adminMsg, employee: empMsg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
