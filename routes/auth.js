const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { generateLoginId } = require('../utils/loginIdGenerator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role, companyName, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    if (!['HR', 'Employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be HR or Employee' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let employee = null;
    let employeeId = null;
    let loginId = null;

    // If HR is signing up, create employee record
    if (role === 'HR' && companyName && firstName && lastName) {
      const yearOfJoining = new Date().getFullYear();
      const { loginId: generatedLoginId, serialNumber } = await generateLoginId(
        companyName,
        firstName,
        lastName,
        yearOfJoining
      );

      loginId = generatedLoginId;

      employee = new Employee({
        loginId: generatedLoginId,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        companyName,
        yearOfJoining,
        serialNumber
      });

      await employee.save();
      employeeId = employee._id;
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role,
      employeeId: loginId,
      employeeRef: employeeId
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).populate('employeeRef');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employeeRef
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin', error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('employeeRef');
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employeeRef
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

