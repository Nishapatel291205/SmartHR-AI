const express = require('express');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { authenticate, isHR } = require('../middleware/auth');

const router = express.Router();

// All reports are HR only
router.use(authenticate);
router.use(isHR);

// Attendance Report
router.get('/attendance', async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    let query = {};
    if (employeeId) {
      query.employee = employeeId;
    }

    if (startDate && endDate) {
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
      .populate('employee', 'firstName lastName email loginId')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalRecords: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      onLeave: attendance.filter(a => a.status === 'On Leave').length,
      halfDay: attendance.filter(a => a.status === 'Half-Day').length,
      totalWorkHours: attendance.reduce((sum, a) => sum + (a.workHours || 0), 0),
      totalExtraHours: attendance.reduce((sum, a) => sum + (a.extraHours || 0), 0)
    };

    res.json({
      summary,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave Summary Report
router.get('/leaves', async (req, res) => {
  try {
    const { startDate, endDate, status, timeOffType } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }
    if (timeOffType) {
      query.timeOffType = timeOffType;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const leaves = await LeaveRequest.find(query)
      .populate('employee', 'firstName lastName email loginId')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'Pending').length,
      approved: leaves.filter(l => l.status === 'Approved').length,
      rejected: leaves.filter(l => l.status === 'Rejected').length,
      paidTimeOff: leaves.filter(l => l.timeOffType === 'Paid Time Off' && l.status === 'Approved').length,
      sickLeave: leaves.filter(l => l.timeOffType === 'Sick Leave' && l.status === 'Approved').length,
      unpaidLeaves: leaves.filter(l => l.timeOffType === 'Unpaid Leaves' && l.status === 'Approved').length,
      totalDays: leaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.allocation, 0)
    };

    res.json({
      summary,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Payroll Summary Report
router.get('/payroll', async (req, res) => {
  try {
    const payrolls = await Payroll.find({ isActive: true })
      .populate('employee', 'firstName lastName email loginId department')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalEmployees: payrolls.length,
      totalMonthlyWage: payrolls.reduce((sum, p) => sum + p.monthWage, 0),
      totalYearlyWage: payrolls.reduce((sum, p) => sum + p.yearlyWage, 0),
      totalGrossSalary: payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0),
      totalNetSalary: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      totalPFContribution: payrolls.reduce((sum, p) => sum + (p.providentFund?.employee?.amount || 0) + (p.providentFund?.employer?.amount || 0), 0)
    };

    res.json({
      summary,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Summary (for HR dashboard)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    // Employees present today
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present'
    });
    const employeesPresentToday = todayAttendance.length;

    // Pending leave requests
    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });

    // Payroll overview
    const payrolls = await Payroll.find({ isActive: true });
    const totalMonthlyPayroll = payrolls.reduce((sum, p) => sum + p.monthWage, 0);

    res.json({
      totalEmployees,
      employeesPresentToday,
      pendingLeaves,
      totalMonthlyPayroll
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

