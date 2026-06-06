import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ALL_STATUSES = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Half Day'];
const CHECK_TIMES = {
  Present : { in: '09:00', out: '18:00', hours: 9 },
  Late    : { in: '10:30', out: '18:00', hours: 7.5 },
  Absent  : { in: '',      out: '',      hours: 0 },
  'Half Day': { in: '09:00', out: '13:00', hours: 4 },
  'On Leave': { in: '',      out: '',      hours: 0 },
};

const randomStatus = () => ALL_STATUSES[Math.floor(Math.random() * ALL_STATUSES.length)];

const isWeekend = (d) => { const day = d.getDay(); return day === 0 || day === 6; };

const seedAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
    console.log('✅ Connected to MongoDB');

    const employees = await User.find({ role: 'employee' }).select('-password');
    if (!employees.length) { console.log('⚠️  No employees found.'); process.exit(0); }

    console.log(`👥 ${employees.length} employees found\n`);

    const today = new Date();
    let created = 0, skipped = 0;

    // Generate attendance for last 2 months (working days only)
    for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      if (isWeekend(date)) continue; // skip weekends
      if (date > today) continue;

      const dateStr = date.toISOString().split('T')[0];

      for (const emp of employees) {
        const existing = await mongoose.connection.collection('attendances').findOne({
          employee: emp._id,
          date: date,
        });
        if (existing) { skipped++; continue; }

        // Last few days show more variety; older days mostly present
        const isRecent = daysAgo < 10;
        let status = isRecent ? randomStatus() : (Math.random() > 0.15 ? 'Present' : randomStatus());
        const times = CHECK_TIMES[status] || CHECK_TIMES['Present'];

        await mongoose.connection.collection('attendances').insertOne({
          employee : emp._id,
          date     : date,
          status,
          checkIn  : times.in,
          checkOut : times.out,
          workHours: times.hours,
          note     : status === 'Late' ? 'Traffic delay' : status === 'Absent' ? 'Unplanned absence' : '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        created++;
      }
    }

    console.log(`🎉 Done! Created: ${created} | Skipped (already exist): ${skipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAttendance();
