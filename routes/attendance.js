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
      // Ensure we use the ObjectId (handle populated doc or plain id)
      const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;
      query.employee = empId;
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

    const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: empId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employee: empId,
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

    const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: empId,
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

    const empId = req.user.employeeRef._id ? req.user.employeeRef._id : req.user.employeeRef;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: empId,
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
      // Handle both object and string cases
      employeeId = req.user.employeeRef._id ? req.user.employeeRef._id.toString() : req.user.employeeRef.toString();
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

    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const leavesCount = attendance.filter(a => a.status === 'On Leave').length;
    const totalWorkDays = attendance.length;

    res.json({
      presentDays,
      leavesCount,
      totalWorkDays,
      absentDays: totalWorkDays - presentDays - leavesCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create attendance (HR only)
router.post('/', authenticate, isHR, async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut, workHours, extraHours, notes } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    // Check if attendance already exists
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: dateOnly, $lt: nextDay }
    });

    if (attendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this date' });
    }

    // Parse checkIn and checkOut times if provided
    let checkInDate = null;
    let checkOutDate = null;
    
    if (checkIn) {
      checkInDate = new Date(dateOnly);
      const [hours, minutes] = checkIn.split(':');
      checkInDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    if (checkOut) {
      checkOutDate = new Date(dateOnly);
      const [hours, minutes] = checkOut.split(':');
      checkOutDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    // Calculate work hours if both checkIn and checkOut are provided
    let calculatedWorkHours = workHours;
    let calculatedExtraHours = extraHours;
    if (checkInDate && checkOutDate && !workHours) {
      const workHoursMs = checkOutDate - checkInDate;
      calculatedWorkHours = workHoursMs / (1000 * 60 * 60);
      const standardHours = 8;
      if (calculatedWorkHours > standardHours) {
        calculatedExtraHours = calculatedWorkHours - standardHours;
      }
    }

    attendance = new Attendance({
      employee: employeeId,
      date: dateOnly,
      status: status || 'Present',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      workHours: calculatedWorkHours || 0,
      extraHours: calculatedExtraHours || 0,
      notes: notes || ''
    });

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName email loginId');

    res.status(201).json({
      message: 'Attendance created successfully',
      attendance: populated
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

    // Handle checkIn and checkOut time strings
    if (req.body.checkIn && typeof req.body.checkIn === 'string') {
      const dateOnly = new Date(attendance.date);
      dateOnly.setHours(0, 0, 0, 0);
      const [hours, minutes] = req.body.checkIn.split(':');
      dateOnly.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      req.body.checkIn = dateOnly;
    }
    
    if (req.body.checkOut && typeof req.body.checkOut === 'string') {
      const dateOnly = new Date(attendance.date);
      dateOnly.setHours(0, 0, 0, 0);
      const [hours, minutes] = req.body.checkOut.split(':');
      dateOnly.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      req.body.checkOut = dateOnly;
    }

    // Calculate work hours if both checkIn and checkOut are provided
    if (req.body.checkIn && req.body.checkOut && !req.body.workHours) {
      const workHoursMs = new Date(req.body.checkOut) - new Date(req.body.checkIn);
      req.body.workHours = workHoursMs / (1000 * 60 * 60);
      const standardHours = 8;
      if (req.body.workHours > standardHours) {
        req.body.extraHours = req.body.workHours - standardHours;
      }
    }

    Object.assign(attendance, req.body);
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName email loginId');

    res.json({ message: 'Attendance updated successfully', attendance: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

