const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    const user = await User.findById(decoded.userId).populate('employeeRef');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is HR/Admin
const isHR = (req, res, next) => {
  if (req.user && req.user.role === 'HR') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. HR role required.' });
  }
};

// Check if user is Employee
const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === 'Employee') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Employee role required.' });
  }
};

module.exports = { authenticate, isHR, isEmployee };

