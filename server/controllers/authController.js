import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate request
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check role matches
    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. Invalid portal for role: ${user.role}` });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        _id        : user._id,
        name       : user.name,
        email      : user.email,
        role       : user.role,
        phone      : user.phone,
        bio        : user.bio,
        department : user.department,
        position   : user.position,
        joinDate   : user.joinDate,
        status     : user.status,
        createdAt  : user.createdAt,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
