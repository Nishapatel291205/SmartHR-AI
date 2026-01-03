const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  monthWage: {
    type: Number,
    required: true
  },
  yearlyWage: {
    type: Number,
    required: true
  },
  workingDaysPerWeek: {
    type: Number,
    default: 5
  },
  workingHoursPerDay: {
    type: Number,
    default: 8
  },
  breakTime: {
    type: Number, // in minutes
    default: 60
  },
  salaryComponents: {
    basicSalary: {
      amount: Number,
      percentage: Number,
      description: String
    },
    houseRentAllowance: {
      amount: Number,
      percentage: Number,
      description: String
    },
    standardAllowance: {
      amount: Number,
      percentage: Number,
      description: String
    },
    performanceBonus: {
      amount: Number,
      percentage: Number,
      description: String
    },
    leaveTravelAllowance: {
      amount: Number,
      percentage: Number,
      description: String
    },
    fixedAllowance: {
      amount: Number,
      percentage: Number,
      description: String
    }
  },
  providentFund: {
    employee: {
      amount: Number,
      percentage: Number
    },
    employer: {
      amount: Number,
      percentage: Number
    }
  },
  professionalTax: {
    amount: Number
  },
  grossSalary: {
    type: Number
  },
  netSalary: {
    type: Number
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

module.exports = mongoose.model('Payroll', payrollSchema);

