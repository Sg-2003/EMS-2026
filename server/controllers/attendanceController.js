import Attendance from '../models/Attendance.js';
import User       from '../models/User.js';

const calcHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const [ih, im] = checkIn.split(':').map(Number);
  const [oh, om] = checkOut.split(':').map(Number);
  const diff = (oh * 60 + om) - (ih * 60 + im);
  return diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 0;
};

// ── CREATE / MARK  POST /api/attendance  (admin) ─────────────────
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, note } = req.body;
    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, message: 'employeeId, date and status are required' });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const workHours = calcHours(checkIn, checkOut);

    // Upsert: update if exists, create if not
    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: dayStart },
      { employee: employeeId, date: dayStart, status, checkIn, checkOut, workHours, note },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    const populated = await Attendance.findById(record._id)
      .populate('employee', 'name email department position');

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('markAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── BULK MARK  POST /api/attendance/bulk  (admin) ────────────────
export const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ employeeId, status, checkIn, checkOut, note }]
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'date and records[] are required' });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const ops = records.map(r => ({
      updateOne: {
        filter : { employee: r.employeeId, date: dayStart },
        update : {
          $set: {
            employee  : r.employeeId,
            date      : dayStart,
            status    : r.status || 'Present',
            checkIn   : r.checkIn  || '',
            checkOut  : r.checkOut || '',
            workHours : calcHours(r.checkIn, r.checkOut),
            note      : r.note || '',
          }
        },
        upsert: true,
      }
    }));

    const result = await Attendance.bulkWrite(ops);
    return res.status(200).json({ success: true, message: `Saved ${result.upsertedCount + result.modifiedCount} records` });
  } catch (error) {
    console.error('bulkMarkAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ ALL  GET /api/attendance  (admin) ───────────────────────
// Query: ?date=YYYY-MM-DD  or ?month=6&year=2026  or ?employeeId=xxx
export const getAllAttendance = async (req, res) => {
  try {
    const { date, month, year, employeeId } = req.query;
    const filter = {};

    if (employeeId) filter.employee = employeeId;

    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: dEnd };
    } else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name email department position')
      .sort({ date: -1, 'employee.name': 1 });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('getAllAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ MY  GET /api/attendance/my  (employee) ──────────────────
export const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { employee: req.user._id };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end   = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name email department position')
      .sort({ date: -1 });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('getMyAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ TODAY  GET /api/attendance/today  (admin) ───────────────
export const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const records = await Attendance.find({ date: { $gte: today, $lte: todayEnd } })
      .populate('employee', 'name email department position');

    const employees = await User.find({ role: 'employee', status: 'active' }).select('name email department');

    return res.status(200).json({ success: true, data: records, totalEmployees: employees.length });
  } catch (error) {
    console.error('getTodayAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE  PUT /api/attendance/:id  (admin) ─────────────────────
export const updateAttendance = async (req, res) => {
  try {
    const { status, checkIn, checkOut, note } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    if (status)   record.status    = status;
    if (checkIn !== undefined)  record.checkIn  = checkIn;
    if (checkOut !== undefined) record.checkOut = checkOut;
    if (note !== undefined)     record.note     = note;
    record.workHours = calcHours(record.checkIn, record.checkOut);

    await record.save();
    const populated = await Attendance.findById(record._id).populate('employee', 'name email department position');
    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updateAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE  DELETE /api/attendance/:id  (admin) ──────────────────
export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    await record.deleteOne();
    return res.status(200).json({ success: true, message: 'Record deleted', data: {} });
  } catch (error) {
    console.error('deleteAttendance:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
