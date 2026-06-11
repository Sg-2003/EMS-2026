import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User    from './models/User.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import Payslip from './models/Payslip.js';

dotenv.config();

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const calcNet = (basic, allow, bonus, ded) =>
  (Number(basic) || 0) + (Number(allow) || 0) + (Number(bonus) || 0) - (Number(ded) || 0);

const seedPayslips = async () => {
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

    const now   = new Date();
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const emp of employees) {
      const basic  = emp.basicSalary  || 45000;
      const allow  = emp.allowances   || 8000;
      const ded    = emp.deductions   || 5000;

      for (let i = 0; i < 6; i++) {
        let month = now.getMonth() + 1 - i;
        let year  = now.getFullYear();
        if (month <= 0) { month += 12; year -= 1; }

        // Check existing
        const exists = await Payslip.findOne({ employee: emp._id, month, year });
        if (exists) {
          console.log(`  ⏭  Skip  : ${emp.name} — ${MONTHS[month-1]} ${year}`);
          totalSkipped++;
          continue;
        }

        const bonus  = (i === 0 || i === 3) ? 3000 : 0;
        const extraD = i === 1 ? 1000 : 0;
        const status = i === 0 ? 'Draft' : 'Paid';
        const paidOn = status === 'Paid' ? new Date(year, month - 1, 28) : undefined;
        const net    = calcNet(basic, allow, bonus, ded + extraD);

        // Use create with raw object — skip pre-save middleware issues
        await mongoose.connection.collection('payslips').insertOne({
          employee    : emp._id,
          month,
          year,
          basicSalary : basic,
          allowances  : allow,
          deductions  : ded + extraD,
          bonus,
          netSalary   : net,
          status,
          paidOn      : paidOn || null,
          notes       : i === 0 ? 'Pending approval' : '',
          createdAt   : new Date(),
          updatedAt   : new Date(),
        });

        console.log(`  ✅ Created: ${emp.name} — ${MONTHS[month-1]} ${year} | Status: ${status} | Net: ₹${net.toLocaleString('en-IN')}`);
        totalCreated++;
      }
    }

    console.log(`\n🎉 Seeding complete! Created: ${totalCreated} | Skipped: ${totalSkipped}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedPayslips();
