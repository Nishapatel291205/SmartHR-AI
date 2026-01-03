const express = require('express');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { authenticate, isHR } = require('../middleware/auth');

const router = express.Router();

// Get attendance records
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, startDate, endDate, employeeId } = req.query;
    let query = {};

    // Employees can only view their own attendance
    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef) {
        return res.status(400).json({ message: 'Employee profile not found' });
      }
      query.employee = req.user.employeeRef;
    } else if (req.user.role === 'HR' && employeeId) {
      query.employee = employeeId;
    }

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDay };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else {
      // Default: current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName email loginId profilePicture')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check In
router.post('/checkin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Employee' || !req.user.employeeRef) {
      return res.status(403).json({ message: 'Only employees can check in' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: req.user.employeeRef,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employee: req.user.employeeRef,
        date: today,
        status: 'Present'
      });
    }

    attendance.checkIn = new Date();
    attendance.status = 'Present';
    await attendance.save();

    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check Out
router.post('/checkout', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Employee' || !req.user.employeeRef) {
      return res.status(403).json({ message: 'Only employees can check out' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user.employeeRef,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Please check in first' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();

    // Calculate work hours
    const workHoursMs = attendance.checkOut - attendance.checkIn;
    const workHours = workHoursMs / (1000 * 60 * 60); // Convert to hours
    attendance.workHours = Math.round(workHours * 100) / 100;

    // Calculate extra hours (assuming 8 hours is standard)
    const standardHours = 8;
    if (workHours > standardHours) {
      attendance.extraHours = Math.round((workHours - standardHours) * 100) / 100;
    }

    await attendance.save();

    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get today's attendance status
router.get('/today', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Employee' || !req.user.employeeRef) {
      return res.status(403).json({ message: 'Only employees can access this' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user.employeeRef,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    res.json({
      checkedIn: !!attendance?.checkIn,
      checkedOut: !!attendance?.checkOut,
      checkInTime: attendance?.checkIn,
      checkOutTime: attendance?.checkOut,
      workHours: attendance?.workHours || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance summary for employee
router.get('/summary/:employeeId?', authenticate, async (req, res) => {
  try {
    let employeeId = req.params.employeeId;

    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef) {
        return res.status(400).json({ message: 'Employee profile not found' });
      }
      employeeId = req.user.employeeRef.toString();
    }

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID required' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const presentDays = attendance.filter(a => a.status === 'Present' || a.status === 'On Leave').length;
    const totalWorkDays = attendance.length;

    res.json({
      presentDays,
      totalWorkDays,
      absentDays: totalWorkDays - presentDays
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update attendance (HR only)
router.put('/:id', authenticate, isHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    Object.assign(attendance, req.body);
    await attendance.save();

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

