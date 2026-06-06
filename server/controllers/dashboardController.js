import User       from '../models/User.js';
import Leave      from '../models/Leave.js';
import Payslip    from '../models/Payslip.js';
import Attendance from '../models/Attendance.js';

// ── GET /api/dashboard/stats  (admin) ───────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now); today.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // ── Employees ──────────────────────────────────────────────
    const totalEmployees  = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
    const departments     = await User.distinct('department', { role: 'employee', department: { $ne: null } });

    const recentEmployees = await User.find({ role: 'employee' })
      .select('name department position joinDate status')
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Attendance (today) ────────────────────────────────────
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lte: todayEnd }
    }).populate('employee', 'name department');

    const todayPresent  = todayAttendance.filter(a => a.status === 'Present').length;
    const todayAbsent   = todayAttendance.filter(a => a.status === 'Absent').length;
    const todayLate     = todayAttendance.filter(a => a.status === 'Late').length;
    const todayOnLeave  = todayAttendance.filter(a => a.status === 'On Leave').length;

    // ── Attendance (this month) ───────────────────────────────
    const monthAttendance = await Attendance.find({
      date: { $gte: thisMonthStart, $lte: thisMonthEnd }
    });
    const monthPresent = monthAttendance.filter(a => a.status === 'Present').length;
    const monthTotal   = monthAttendance.length;
    const attendanceRate = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0;

    // ── Leaves ────────────────────────────────────────────────
    const pendingLeaves  = await Leave.countDocuments({ status: 'Pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'Approved' });
    const rejectedLeaves = await Leave.countDocuments({ status: 'Rejected' });

    const recentLeaves = await Leave.find()
      .populate('employee', 'name department')
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Payslips ──────────────────────────────────────────────
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const monthPayslips = await Payslip.find({ month, year });
    const paidPayslips  = monthPayslips.filter(p => p.status === 'Paid').length;
    const draftPayslips = monthPayslips.filter(p => p.status === 'Draft').length;
    const totalPayout   = monthPayslips.reduce((s, p) => s + (p.netSalary || 0), 0);

    // ── Dept breakdown ────────────────────────────────────────
    const deptBreakdown = await User.aggregate([
      { $match: { role: 'employee', department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // ── Leave type breakdown (this month) ─────────────────────
    const leaveTypeBreakdown = await Leave.aggregate([
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        employees: { total: totalEmployees, active: activeEmployees, departments: departments.length, recent: recentEmployees },
        attendance: {
          today: { present: todayPresent, absent: todayAbsent, late: todayLate, onLeave: todayOnLeave, total: todayAttendance.length },
          month: { rate: attendanceRate, present: monthPresent, total: monthTotal },
          recentToday: todayAttendance.slice(0, 6),
        },
        leaves: { pending: pendingLeaves, approved: approvedLeaves, rejected: rejectedLeaves, recent: recentLeaves },
        payslips: { paid: paidPayslips, draft: draftPayslips, totalPayout, month, year },
        charts: { deptBreakdown, leaveTypeBreakdown },
      },
    });
  } catch (error) {
    console.error('getAdminStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/dashboard/my-stats  (employee) ─────────────────────
export const getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const month  = now.getMonth() + 1;
    const year   = now.getFullYear();

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 0, 23, 59, 59, 999);

    // My attendance this month
    const myAttendance = await Attendance.find({
      employee: userId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const present  = myAttendance.filter(a => a.status === 'Present').length;
    const absent   = myAttendance.filter(a => a.status === 'Absent').length;
    const late     = myAttendance.filter(a => a.status === 'Late').length;
    const halfDay  = myAttendance.filter(a => a.status === 'Half Day').length;
    const onLeave  = myAttendance.filter(a => a.status === 'On Leave').length;
    const rate     = myAttendance.length > 0 ? Math.round((present / myAttendance.length) * 100) : 0;

    // My leaves
    const myLeaves    = await Leave.find({ employee: userId }).sort({ createdAt: -1 });
    const pending     = myLeaves.filter(l => l.status === 'Pending').length;
    const approved    = myLeaves.filter(l => l.status === 'Approved').length;
    const recentLeaves = myLeaves.slice(0, 4);

    // My payslips
    const myPayslips   = await Payslip.find({ employee: userId }).sort({ year: -1, month: -1 }).limit(6);
    const latestPayslip = myPayslips[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        attendance: { present, absent, late, halfDay, onLeave, rate, total: myAttendance.length },
        leaves: { pending, approved, total: myLeaves.length, recent: recentLeaves },
        payslips: { recent: myPayslips, latest: latestPayslip },
      },
    });
  } catch (error) {
    console.error('getMyStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
