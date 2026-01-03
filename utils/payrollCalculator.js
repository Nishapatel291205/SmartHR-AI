/**
 * Calculate payroll components based on wage
 */
function calculatePayrollComponents(monthWage, config = {}) {
  // Default configuration
  const defaultConfig = {
    basicSalaryPercent: 50,
    hraPercentOfBasic: 50,
    standardAllowanceAmount: 4167,
    performanceBonusPercent: 8.33,
    leaveTravelAllowancePercent: 8.333,
    pfPercent: 12,
    professionalTax: 200
  };

  const cfg = { ...defaultConfig, ...config };

  // Calculate Basic Salary
  const basicSalary = (monthWage * cfg.basicSalaryPercent) / 100;

  // Calculate HRA (50% of Basic)
  const hra = (basicSalary * cfg.hraPercentOfBasic) / 100;

  // Standard Allowance (Fixed)
  const standardAllowance = cfg.standardAllowanceAmount;

  // Performance Bonus (8.33% of Basic)
  const performanceBonus = (basicSalary * cfg.performanceBonusPercent) / 100;

  // Leave Travel Allowance (8.333% of Basic)
  const leaveTravelAllowance = (basicSalary * cfg.leaveTravelAllowancePercent) / 100;

  // Fixed Allowance = Wage - (Basic + HRA + Standard + Performance + LTA)
  const totalOtherComponents = basicSalary + hra + standardAllowance + performanceBonus + leaveTravelAllowance;
  const fixedAllowance = monthWage - totalOtherComponents;

  // Provident Fund (12% of Basic)
  const pfEmployee = (basicSalary * cfg.pfPercent) / 100;
  const pfEmployer = (basicSalary * cfg.pfPercent) / 100;

  // Professional Tax
  const professionalTax = cfg.professionalTax;

  // Gross Salary
  const grossSalary = monthWage;

  // Net Salary = Gross - PF Employee - Professional Tax
  const netSalary = grossSalary - pfEmployee - professionalTax;

  return {
    basicSalary: {
      amount: basicSalary,
      percentage: cfg.basicSalaryPercent,
      description: 'Define Basic salary from company cost compute it based on monthly wages.'
    },
    houseRentAllowance: {
      amount: hra,
      percentage: cfg.hraPercentOfBasic,
      description: 'HRA provided to employees 50% of the basic salary'
    },
    standardAllowance: {
      amount: standardAllowance,
      percentage: (standardAllowance / monthWage) * 100,
      description: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary'
    },
    performanceBonus: {
      amount: performanceBonus,
      percentage: cfg.performanceBonusPercent,
      description: 'Variable amount paid during payroll. The value defined by the company calculated as a % of the basic salary'
    },
    leaveTravelAllowance: {
      amount: leaveTravelAllowance,
      percentage: cfg.leaveTravelAllowancePercent,
      description: 'LTA is paid by the company to employees to cover their travel expenses. and calculated as a % of the basic salary'
    },
    fixedAllowance: {
      amount: fixedAllowance,
      percentage: (fixedAllowance / monthWage) * 100,
      description: 'fixed allowance portion of wages is determined after calculating all salary components'
    },
    providentFund: {
      employee: {
        amount: pfEmployee,
        percentage: cfg.pfPercent
      },
      employer: {
        amount: pfEmployer,
        percentage: cfg.pfPercent
      }
    },
    professionalTax: {
      amount: professionalTax
    },
    grossSalary,
    netSalary
  };
}

module.exports = { calculatePayrollComponents };

