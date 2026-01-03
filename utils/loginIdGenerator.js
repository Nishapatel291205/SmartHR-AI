const Employee = require('../models/Employee');

/**
 * Generate Login ID in format: [CompanyCode][First2Last2][Year][Serial]
 * Example: OIJOD020220001
 * OI -> Odoo India (Company Code)
 * JODO -> First two letters of first name and last name
 * 2022 -> Year of Joining
 * 0001 -> Serial Number
 */
async function generateLoginId(companyName, firstName, lastName, yearOfJoining) {
  try {
    // Extract company code (first two letters, uppercase)
    const companyCode = companyName.substring(0, 2).toUpperCase();
    
    // Extract first two letters of first name and last name
    const nameCode = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();
    
    // Get year (last 2 digits)
    const year = yearOfJoining.toString().slice(-2);
    
    // Find the last serial number for this year and company
    const lastEmployee = await Employee.findOne({
      yearOfJoining: yearOfJoining,
      companyName: companyName
    }).sort({ serialNumber: -1 });
    
    // Generate new serial number
    const serialNumber = lastEmployee ? lastEmployee.serialNumber + 1 : 1;
    const serialStr = serialNumber.toString().padStart(4, '0');
    
    // Combine: CompanyCode + NameCode + Year + Serial
    const loginId = `${companyCode}${nameCode}${year}${serialStr}`;
    
    return {
      loginId,
      serialNumber
    };
  } catch (error) {
    throw new Error(`Error generating login ID: ${error.message}`);
  }
}

module.exports = { generateLoginId };

