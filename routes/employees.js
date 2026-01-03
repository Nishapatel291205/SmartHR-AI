const express = require('express');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authenticate, isHR } = require('../middleware/auth');
const { generateLoginId } = require('../utils/loginIdGenerator');

const router = express.Router();

// Get all employees (HR only)
router.get('/', authenticate, isHR, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single employee
router.get('/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    // Employees can only view their own profile
    if (req.user.role === 'Employee' && req.user.employeeRef?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee (HR only)
router.post('/', authenticate, isHR, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      jobPosition,
      department,
      manager,
      location,
      dateOfJoining,
      monthWage
    } = req.body;

    if (!firstName || !lastName || !email || !companyName) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const yearOfJoining = dateOfJoining ? new Date(dateOfJoining).getFullYear() : new Date().getFullYear();
    const { loginId, serialNumber } = await generateLoginId(
      companyName,
      firstName,
      lastName,
      yearOfJoining
    );

    // Generate random password for first time
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const employee = new Employee({
      loginId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      companyName,
      jobPosition,
      department,
      manager,
      location,
      dateOfJoining: dateOfJoining || new Date(),
      yearOfJoining,
      serialNumber
    });

    await employee.save();

    // Create user account
    const user = new User({
      email: email.toLowerCase(),
      password: randomPassword, // Will be hashed automatically
      role: 'Employee',
      employeeId: loginId,
      employeeRef: employee._id
    });

    await user.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee,
      loginId,
      temporaryPassword: randomPassword // In production, send via email
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update employee
router.put('/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employees can only edit limited fields
    if (req.user.role === 'Employee') {
      if (req.user.employeeRef?.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Allow only specific fields for employees
      const allowedFields = ['phone', 'residingAddress', 'personalEmail', 'profilePicture', 'about', 'whatILoveAboutJob', 'interestsAndHobbies', 'skills', 'certifications', 'bankDetails'];
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      updateData.updatedAt = new Date();
      Object.assign(employee, updateData);
    } else if (req.user.role === 'HR') {
      // HR can edit all fields
      Object.assign(employee, req.body);
      employee.updatedAt = new Date();
    }

    await employee.save();
    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete employee (HR only - soft delete)
router.delete('/:id', authenticate, isHR, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.isActive = false;
    await employee.save();

    // Deactivate user account
    const user = await User.findOne({ employeeRef: employee._id });
    if (user) {
      user.isActive = false;
      await user.save();
    }

    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

