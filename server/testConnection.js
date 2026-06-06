import mongoose from 'mongoose';
import readline from 'readline';
import User from './models/User.js';
import bcrypt from 'bcrypt';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your MongoDB Atlas password for user "sukumar": ', async (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    rl.close();
    return;
  }

  const uri = `mongodb+srv://sukumar:${encodeURIComponent(password)}@cluster0.b4pieja.mongodb.net/ems?retryWrites=true&w=majority`;
  
  console.log('\nConnecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Success! Connected to MongoDB Atlas.');
    
    // Seed admin user
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Created default admin account: admin@example.com / admin123');
    } else {
      console.log('ℹ️ Admin account already exists in the database.');
    }

    // Seed default employee
    const employeeExists = await User.findOne({ email: 'employee@example.com' });
    if (!employeeExists) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      const employeeUser = new User({
        name: 'John Doe',
        email: 'employee@example.com',
        password: hashedPassword,
        role: 'employee'
      });
      await employeeUser.save();
      console.log('✅ Created default employee account: employee@example.com / employee123');
    } else {
      console.log('ℹ️ Employee account already exists in the database.');
    }
    
    await mongoose.disconnect();
    console.log('\nAll set! Database connection and seeding completed successfully.');
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message);
    console.log('\nPossible causes:\n1. The password you entered is incorrect.\n2. Your current IP address is not whitelisted in MongoDB Atlas Network Access.');
  }
  rl.close();
});
