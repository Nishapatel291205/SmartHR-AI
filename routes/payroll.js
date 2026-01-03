const express = require('express');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { authenticate, isHR } = require('../middleware/auth');
const { calculatePayrollComponents } = require('../utils/payrollCalculator');

const router = express.Router();

// Get payroll records
router.get('/', authenticate, async (req, res) => {
  try {
    let query = { isActive: true };

    // Employees can only view their own payroll
    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef) {
        return res.status(400).json({ message: 'Employee profile not found' });
      }
      query.employee = req.user.employeeRef;
    }
    // HR can view all payrolls

    const payrolls = await Payroll.find(query)
      .populate('employee', 'firstName lastName email loginId profilePicture')
      .sort({ createdAt: -1 });

    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single payroll
router.get('/:id', authenticate, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName email loginId profilePicture');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Employees can only view their own payroll
    if (req.user.role === 'Employee' && payroll.employee._id.toString() !== req.user.employeeRef?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payroll by employee ID
router.get('/employee/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Employees can only view their own payroll
    if (req.user.role === 'Employee') {
      if (!req.user.employeeRef || req.user.employeeRef.toString() !== employeeId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const payroll = await Payroll.findOne({
      employee: employeeId,
      isActive: true
    }).populate('employee', 'firstName lastName email loginId profilePicture');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found for this employee' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update payroll (HR only)
router.post('/', authenticate, isHR, async (req, res) => {
  try {
    const {
      employeeId,
      monthWage,
      yearlyWage,
      workingDaysPerWeek,
      workingHoursPerDay,
      breakTime,
      config
    } = req.body;

    if (!employeeId || !monthWage) {
      return res.status(400).json({ message: 'Employee ID and monthly wage are required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate payroll components
    const components = calculatePayrollComponents(monthWage, config);

    // Check if payroll exists
    let payroll = await Payroll.findOne({ employee: employeeId, isActive: true });

    if (payroll) {
      // Update existing payroll
      payroll.monthWage = monthWage;
      payroll.yearlyWage = yearlyWage || monthWage * 12;
      payroll.workingDaysPerWeek = workingDaysPerWeek || 5;
      payroll.workingHoursPerDay = workingHoursPerDay || 8;
      payroll.breakTime = breakTime || 60;
      payroll.salaryComponents = components.salaryComponents;
      payroll.providentFund = components.providentFund;
      payroll.professionalTax = components.professionalTax;
      payroll.grossSalary = components.grossSalary;
      payroll.netSalary = components.netSalary;
      payroll.updatedAt = new Date();
    } else {
      // Create new payroll
      payroll = new Payroll({
        employee: employeeId,
        monthWage,
        yearlyWage: yearlyWage || monthWage * 12,
        workingDaysPerWeek: workingDaysPerWeek || 5,
        workingHoursPerDay: workingHoursPerDay || 8,
        breakTime: breakTime || 60,
        salaryComponents: components.salaryComponents,
        providentFund: components.providentFund,
        professionalTax: components.professionalTax,
        grossSalary: components.grossSalary,
        netSalary: components.netSalary
      });
    }

    await payroll.save();

    const populated = await Payroll.findById(payroll._id)
      .populate('employee', 'firstName lastName email loginId profilePicture');

    res.status(201).json({
      message: 'Payroll saved successfully',
      payroll: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payroll (HR only)
router.put('/:id', authenticate, isHR, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // If monthWage is updated, recalculate components
    if (req.body.monthWage && req.body.monthWage !== payroll.monthWage) {
      const components = calculatePayrollComponents(req.body.monthWage, req.body.config);
      req.body.salaryComponents = components.salaryComponents;
      req.body.providentFund = components.providentFund;
      req.body.professionalTax = components.professionalTax;
      req.body.grossSalary = components.grossSalary;
      req.body.netSalary = components.netSalary;
    }

    Object.assign(payroll, req.body);
    payroll.updatedAt = new Date();
    await payroll.save();

    const populated = await Payroll.findById(payroll._id)
      .populate('employee', 'firstName lastName email loginId profilePicture');

    res.json({
      message: 'Payroll updated successfully',
      payroll: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

