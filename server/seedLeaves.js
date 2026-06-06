import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User  from './models/User.js';
import Leave from './models/Leave.js';

dotenv.config();

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

const SAMPLE_REASONS = {
  Annual    : ['Family vacation', 'Personal trip', 'Home renovation', 'Annual holiday'],
  Sick      : ['High fever and flu', 'Doctor appointment', 'Medical procedure', 'Not feeling well'],
  Casual    : ['Personal work', 'Family function', 'Bank work', 'Urgent personal matter'],
  Maternity : ['Maternity leave'],
  Paternity : ['Paternity leave — newborn'],
  Unpaid    : ['Extended personal leave', 'Travelling abroad'],
  Other     : ['Religious festival', 'Emergency at home'],
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Predefined realistic leaves (spread across last 5 months)
const getLeaveSlots = (year) => [
  // month offsets from June 2026
  { startOffset: -150, dur: 3, type: 'Annual',  status: 'Approved' },
  { startOffset: -120, dur: 1, type: 'Sick',    status: 'Approved' },
  { startOffset:  -90, dur: 2, type: 'Casual',  status: 'Approved' },
  { startOffset:  -60, dur: 1, type: 'Sick',    status: 'Rejected' },
  { startOffset:  -30, dur: 2, type: 'Annual',  status: 'Approved' },
  { startOffset:  -14, dur: 1, type: 'Casual',  status: 'Pending'  },
  { startOffset:   -5, dur: 3, type: 'Annual',  status: 'Pending'  },
];

const seedLeaves = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('✅ Connected to MongoDB');

    const employees = await User.find({ role: 'employee' }).select('-password');
    if (employees.length === 0) {
      console.log('⚠️  No employees found. Run seed.js first.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`👥 Found ${employees.length} employee(s): ${employees.map(e => e.name).join(', ')}\n`);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let created = 0;
    let skipped = 0;

    for (const emp of employees) {
      const slots = getLeaveSlots(today.getFullYear());

      // Stagger each employee slightly so dates don't perfectly overlap
      const empOffset = Math.floor(Math.random() * 5);

      for (const slot of slots) {
        const startDate = addDays(todayStr, slot.startOffset - empOffset);
        const endDate   = addDays(startDate, slot.dur - 1);
        const reason    = randomItem(SAMPLE_REASONS[slot.type] || ['Personal reason']);

        try {
          await mongoose.connection.collection('leaves').insertOne({
            employee  : emp._id,
            leaveType : slot.type,
            startDate : new Date(startDate),
            endDate   : new Date(endDate),
            reason,
            status    : slot.status,
            adminNote : slot.status === 'Rejected'
              ? 'Insufficient leave balance for this period'
              : slot.status === 'Approved'
                ? 'Approved by HR'
                : '',
            createdAt : new Date(startDate),
            updatedAt : new Date(),
          });

          console.log(`  ✅ ${emp.name.padEnd(20)} | ${slot.type.padEnd(10)} | ${startDate} → ${endDate} | ${slot.status}`);
          created++;
        } catch (err) {
          if (err.code === 11000) {
            skipped++;
          } else {
            console.error(`  ❌ Error for ${emp.name}:`, err.message);
          }
        }
      }
    }

    console.log(`\n🎉 Done! Created: ${created} leaves | Skipped: ${skipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedLeaves();
