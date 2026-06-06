import Payslip from '../models/Payslip.js';
import User    from '../models/User.js';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── CREATE  POST /api/payslips  (admin) ──────────────────────────
export const createPayslip = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions, bonus, notes, status } = req.body;

    if (!employeeId || !month || !year || basicSalary === undefined) {
      return res.status(400).json({ success: false, message: 'employeeId, month, year and basicSalary are required' });
    }

    const employee = await User.findById(employeeId).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const payslip = await Payslip.create({
      employee: employeeId,
      month: Number(month),
      year:  Number(year),
      basicSalary:  Number(basicSalary)  || 0,
      allowances:   Number(allowances)   || 0,
      deductions:   Number(deductions)   || 0,
      bonus:        Number(bonus)        || 0,
      notes,
      status: status || 'Draft',
    });

    const populated = await Payslip.findById(payslip._id).populate('employee', 'name email department position');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Payslip for ${MONTHS[Number(req.body.month)-1]} ${req.body.year} already exists for this employee` });
    }
    console.error('createPayslip:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ ALL  GET /api/payslips  (admin) ─────────────────────────
export const getAllPayslips = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const filter = {};
    if (month)      filter.month    = Number(month);
    if (year)       filter.year     = Number(year);
    if (employeeId) filter.employee = employeeId;

    const payslips = await Payslip.find(filter)
      .populate('employee', 'name email department position')
      .sort({ year: -1, month: -1 });

    return res.status(200).json({ success: true, data: payslips });
  } catch (error) {
    console.error('getAllPayslips:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ MY  GET /api/payslips/my  (employee) ────────────────────
export const getMyPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.user._id })
      .populate('employee', 'name email department position')
      .sort({ year: -1, month: -1 });

    return res.status(200).json({ success: true, data: payslips });
  } catch (error) {
    console.error('getMyPayslips:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── READ ONE  GET /api/payslips/:id  (both) ──────────────────────
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employee', 'name email department position phone joinDate');

    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    // Employee can only view their own
    if (req.user.role !== 'admin' && payslip.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, data: payslip });
  } catch (error) {
    console.error('getPayslipById:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE  PUT /api/payslips/:id  (admin) ───────────────────────
export const updatePayslip = async (req, res) => {
  try {
    const { basicSalary, allowances, deductions, bonus, notes, status } = req.body;

    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    if (basicSalary !== undefined) payslip.basicSalary = Number(basicSalary);
    if (allowances  !== undefined) payslip.allowances  = Number(allowances);
    if (deductions  !== undefined) payslip.deductions  = Number(deductions);
    if (bonus       !== undefined) payslip.bonus       = Number(bonus);
    if (notes       !== undefined) payslip.notes       = notes;
    if (status && ['Draft', 'Paid'].includes(status)) payslip.status = status;

    await payslip.save(); // triggers pre-save for netSalary

    const populated = await Payslip.findById(payslip._id).populate('employee', 'name email department position');
    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updatePayslip:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE  DELETE /api/payslips/:id  (admin) ────────────────────
export const deletePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });

    await payslip.deleteOne();
    return res.status(200).json({ success: true, message: 'Payslip deleted', data: {} });
  } catch (error) {
    console.error('deletePayslip:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GENERATE (bulk for month)  POST /api/payslips/generate  (admin) ─
export const generateMonthlyPayslips = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year are required' });
    }

    const employees = await User.find({ role: 'employee', status: 'active' }).select('-password');
    const results = { created: 0, skipped: 0, errors: [] };

    for (const emp of employees) {
      try {
        const exists = await Payslip.findOne({ employee: emp._id, month: Number(month), year: Number(year) });
        if (exists) { results.skipped++; continue; }

        await Payslip.create({
          employee:    emp._id,
          month:       Number(month),
          year:        Number(year),
          basicSalary: emp.basicSalary  || 0,
          allowances:  emp.allowances   || 0,
          deductions:  emp.deductions   || 0,
          bonus:       0,
          status:      'Draft',
        });
        results.created++;
      } catch (e) {
        results.errors.push({ employee: emp.name, error: e.message });
      }
    }

    return res.status(200).json({ success: true, message: `Generated ${results.created} payslips, skipped ${results.skipped}`, data: results });
  } catch (error) {
    console.error('generateMonthlyPayslips:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
