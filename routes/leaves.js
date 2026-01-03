const express = require('express');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const { authenticate, isHR } = require('../middleware/auth');

const router = express.Router();

// Get leave requests
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};

    // Employees can only view their own leaves
    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef) {
        return res.status(400).json({ message: 'Employee profile not found' });
      }
      const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;
      query.employee = empId;
    }
    // HR can view all leaves

    const leaves = await LeaveRequest.find(query)
      .populate('employee', 'firstName lastName email loginId profilePicture')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single leave request
router.get('/:id', authenticate, async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate('employee', 'firstName lastName email loginId')
      .populate('reviewedBy', 'email');

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Employees can only view their own leaves
    if (req.user.role === 'Employee') {
      const userEmployeeId = req.user.employeeRef?._id ? req.user.employeeRef._id.toString() : req.user.employeeRef?.toString();
      if (leave.employee._id.toString() !== userEmployeeId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for leave (Employee only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Employee' || !req.user.employeeRef) {
      return res.status(403).json({ message: 'Only employees can apply for leave' });
    }

    const { timeOffType, startDate, endDate, reason, attachment } = req.body;

    if (!timeOffType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Time off type, start date, and end date are required' });
    }

    // Calculate allocation (number of days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;

    const leaveRequest = new LeaveRequest({
      employee: empId,
      timeOffType,
      startDate: start,
      endDate: end,
      allocation: diffDays,
      reason,
      attachment,
      status: 'Pending'
    });

    await leaveRequest.save();

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('employee', 'firstName lastName email loginId');

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve/Reject leave (HR only)
router.put('/:id/approve', authenticate, isHR, async (req, res) => {
  try {
    const { status, reviewComments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('employee');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    leaveRequest.reviewedBy = req.user._id;
    leaveRequest.reviewComments = reviewComments;
    leaveRequest.reviewedAt = new Date();

    await leaveRequest.save();

    // If approved, update attendance records
    if (status === 'Approved') {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateOnly = new Date(currentDate);
        dateOnly.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
          {
            employee: leaveRequest.employee._id,
            date: dateOnly
          },
          {
            employee: leaveRequest.employee._id,
            date: dateOnly,
            status: 'On Leave'
          },
          { upsert: true, new: true }
        );

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const updated = await LeaveRequest.findById(leaveRequest._id)
      .populate('employee', 'firstName lastName email loginId')
      .populate('reviewedBy', 'email');

    res.json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete leave request (Employee can delete their own pending requests)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Employees can only delete their own pending requests
    if (req.user.role === 'Employee') {
      const userEmployeeId = req.user.employeeRef?._id ? req.user.employeeRef._id.toString() : req.user.employeeRef?.toString();
      if (leaveRequest.employee.toString() !== userEmployeeId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (leaveRequest.status !== 'Pending') {
        return res.status(400).json({ message: 'Can only delete pending requests' });
      }
    } else if (req.user.role !== 'HR') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leave summary
router.get('/summary/:employeeId?', authenticate, async (req, res) => {
  try {
    let employeeId = req.params.employeeId;

    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef) {
        return res.status(400).json({ message: 'Employee profile not found' });
      }
      // Handle both object and string cases
      employeeId = req.user.employeeRef._id ? req.user.employeeRef._id.toString() : req.user.employeeRef.toString();
    }

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID required' });
    }

    const leaves = await LeaveRequest.find({ employee: employeeId });

    const summary = {
      paidTimeOff: { total: 24, used: 0, available: 24 },
      sickLeave: { total: 7, used: 0, available: 7 },
      unpaidLeaves: { total: 0, used: 0, available: 0 }
    };

    leaves.forEach(leave => {
      if (leave.status === 'Approved') {
        if (leave.timeOffType === 'Paid Time Off') {
          summary.paidTimeOff.used += leave.allocation;
          summary.paidTimeOff.available = summary.paidTimeOff.total - summary.paidTimeOff.used;
        } else if (leave.timeOffType === 'Sick Leave') {
          summary.sickLeave.used += leave.allocation;
          summary.sickLeave.available = summary.sickLeave.total - summary.sickLeave.used;
        } else if (leave.timeOffType === 'Unpaid Leaves') {
          summary.unpaidLeaves.used += leave.allocation;
        }
      }
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

