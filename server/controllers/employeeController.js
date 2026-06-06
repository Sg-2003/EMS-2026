import User from '../models/User.js';
import bcrypt from 'bcrypt';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payslip from '../models/Payslip.js';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, joinDate, bio, department, position, basicSalary, allowances, deductions, status } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      phone,
      joinDate,
      bio,
      department,
      position,
      basicSalary,
      allowances,
      deductions,
      status
    });

    employee.password = undefined;
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
export const updateEmployee = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    let employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    employee = await User.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Cascade delete all associated employee data from other collections
    await Attendance.deleteMany({ employee: req.params.id });
    await Leave.deleteMany({ employee: req.params.id });
    await Payslip.deleteMany({ employee: req.params.id });

    await employee.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
