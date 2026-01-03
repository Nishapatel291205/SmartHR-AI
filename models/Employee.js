const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  loginId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyLogo: {
    type: String
  },
  jobPosition: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  manager: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String
  },
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  yearOfJoining: {
    type: Number,
    required: true
  },
  serialNumber: {
    type: Number,
    required: true
  },
  // Personal Information
  residingAddress: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  personalEmail: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed']
  },
  // Private Info
  about: {
    type: String,
    trim: true
  },
  whatILoveAboutJob: {
    type: String,
    trim: true
  },
  interestsAndHobbies: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date
  }],
  // Bank Details
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    },
    panNo: {
      type: String,
      trim: true
    },
    uanNo: {
      type: String,
      trim: true
    },
    empCode: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Employee', employeeSchema);

