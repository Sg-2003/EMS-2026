import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (adminExists) {
      console.log('Admin user already exists. Skipping seed.');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created: admin@example.com / admin123');
    }

    // Check if employee already exists
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    if (employeeExists) {
      console.log('Employee user already exists. Skipping seed.');
    } else {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      const employeeUser = new User({
        name: 'John Doe',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'employee'
      });
      await employeeUser.save();
      console.log('Employee user created: employee@example.com / employee123');
    }

    mongoose.disconnect();
    console.log('Database seeding completed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
  }
};

seedDatabase();
