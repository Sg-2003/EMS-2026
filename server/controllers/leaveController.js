import Leave from '../models/Leave.js';

// ─────────────────────────────────────────────────────────────────
// CREATE  –  POST /api/leaves
// Employee applies for leave
// ─────────────────────────────────────────────────────────────────
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    const leave = await Leave.create({
      employee : req.user._id,
      leaveType,
      startDate: start,
      endDate  : end,
      reason,
      status   : 'Pending',
    });

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'name email department position');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('applyLeave error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// READ (employee)  –  GET /api/leaves/my
// ─────────────────────────────────────────────────────────────────
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('employee', 'name email department position')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('getMyLeaves error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// READ (admin)  –  GET /api/leaves
// ─────────────────────────────────────────────────────────────────
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'name email department position')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('getAllLeaves error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE (admin – full edit)  –  PUT /api/leaves/:id
// ─────────────────────────────────────────────────────────────────
export const updateLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, status, adminNote } = req.body;

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveType)  leave.leaveType  = leaveType;
    if (startDate)  leave.startDate  = new Date(startDate);
    if (endDate)    leave.endDate    = new Date(endDate);
    if (reason)     leave.reason     = reason;
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      leave.status = status;
    }
    if (adminNote !== undefined) leave.adminNote = adminNote;

    await leave.save();

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'name email department position');

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updateLeave error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE STATUS (admin)  –  PATCH /api/leaves/:id/status
// ─────────────────────────────────────────────────────────────────
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    if (adminNote !== undefined) leave.adminNote = adminNote;
    await leave.save();

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'name email department position');

    return res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('updateLeaveStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE  –  DELETE /api/leaves/:id
// ─────────────────────────────────────────────────────────────────
export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    // Admin can delete any; employee can only delete their own pending leaves
    const isAdmin = req.user.role === 'admin';
    const isOwner = leave.employee.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }
    if (!isAdmin && leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot delete an already-processed leave request' });
    }

    await leave.deleteOne();
    return res.status(200).json({ success: true, message: 'Leave request deleted', data: {} });
  } catch (error) {
    console.error('deleteLeave error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
