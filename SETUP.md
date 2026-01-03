# Dayflow HRMS - Setup & Usage Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/dayflow_hrms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=3000
   ```

3. **Start MongoDB**
   
   Make sure MongoDB is running:
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud) and update MONGODB_URI in .env
   ```

4. **Start the Server**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-reload)
   npm run dev
   ```

5. **Access the Application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📋 First Time Setup

### Step 1: Create HR Account

1. Go to the Sign Up page
2. Fill in the form:
   - **Company Name**: Your company name (e.g., "Odoo India")
   - **Name**: Your first name
   - **Last Name**: Your last name
   - **Email**: Your email address
   - **Phone**: Your phone number
   - **Password**: Create a secure password
   - **Role**: Select "HR / Admin"
3. Click "Sign Up"
4. Your Login ID will be auto-generated in the format: `[CompanyCode][First2Last2][Year][Serial]`
   - Example: `OIJOD020220001`

### Step 2: Create Employee Accounts

1. Log in as HR
2. Navigate to **Employees** from the sidebar
3. Click **"+ New Employee"** button
4. Fill in employee details:
   - First Name, Last Name
   - Email (must be unique)
   - Company Name
   - Job Position, Department, Manager, Location
   - Date of Joining
   - Monthly Wage (optional, for payroll setup)
5. Click **"Create Employee"**
6. The system will:
   - Auto-generate a Login ID
   - Create a temporary password
   - Display both credentials (save these!)
7. Share the Login ID and temporary password with the employee

### Step 3: Employee First Login

1. Employee goes to Sign In page
2. Uses their email or Login ID
3. Uses the temporary password
4. Can then access their dashboard

## 🎯 Features Overview

### HR/Admin Features

#### Dashboard
- View summary cards:
  - Total Employees
  - Employees Present Today
  - Pending Leave Requests
  - Monthly Payroll Overview

#### Employee Management
- View all employees in a grid layout
- See employee status indicators:
  - 🟢 Green dot: Present
  - 🟡 Yellow dot: Absent
  - ✈️ Airplane icon: On Leave
- Add new employees
- Edit employee details
- View individual employee profiles

#### Attendance Management
- View daily attendance for all employees
- Filter by date
- See check-in/check-out times
- View work hours and extra hours
- Update attendance records manually (if needed)

#### Leave Approval
- View all leave requests
- See pending, approved, and rejected leaves
- Approve or reject leave requests
- Add review comments
- Approved leaves automatically update attendance

#### Payroll Management
- View all employee payroll records
- Create/update payroll for employees
- Set monthly wage
- System auto-calculates:
  - Basic Salary (50% of wage)
  - HRA (50% of Basic)
  - Standard Allowance
  - Performance Bonus (8.33% of Basic)
  - Leave Travel Allowance (8.333% of Basic)
  - Fixed Allowance (remaining amount)
  - Provident Fund (12% of Basic)
  - Professional Tax
  - Gross and Net Salary

#### Reports
- **Attendance Report**: Summary of attendance records
- **Leaves Report**: Summary of leave requests
- **Payroll Report**: Summary of payroll data

### Employee Features

#### Dashboard
- Quick access cards:
  - My Profile
  - Attendance Summary
  - Leave Balance
  - Payroll Info
- Check In/Check Out buttons
- Recent activity overview

#### Profile Management
- View personal information
- Edit limited fields:
  - Phone number
  - Residing Address
  - Personal Email
  - Profile Picture
  - About, Interests, Skills, Certifications
  - Bank Details

#### Attendance
- Check In/Check Out
- View monthly attendance records
- See check-in/check-out times
- View work hours
- See attendance status (Present/Absent/On Leave)

#### Leave Management
- View leave balance:
  - Paid Time Off (24 days)
  - Sick Leave (7 days)
- Apply for leave:
  - Select leave type
  - Choose date range
  - Add reason
  - Upload attachment (for sick leave)
- Track leave status (Pending/Approved/Rejected)
- View leave history

#### Payroll View
- View salary structure (read-only)
- See all salary components
- View deductions
- See gross and net salary

## 🔐 Login ID Format

Login IDs are automatically generated in the format:
```
[CompanyCode][First2Last2][Year][Serial]
```

**Example**: `OIJOD020220001`
- `OI` - Company code (first 2 letters of company name)
- `JODO` - First 2 letters of first name + first 2 letters of last name
- `2022` - Year of joining (last 2 digits)
- `0001` - Serial number (increments for each employee in that year)

## 💰 Payroll Calculation

The system automatically calculates salary components based on monthly wage:

1. **Basic Salary**: 50% of monthly wage
2. **HRA**: 50% of Basic Salary
3. **Standard Allowance**: Fixed ₹4,167
4. **Performance Bonus**: 8.33% of Basic Salary
5. **Leave Travel Allowance**: 8.333% of Basic Salary
6. **Fixed Allowance**: Remaining amount (wage - sum of above)
7. **Provident Fund**: 12% of Basic Salary (Employee + Employer)
8. **Professional Tax**: ₹200/month
9. **Gross Salary**: Monthly Wage
10. **Net Salary**: Gross Salary - PF (Employee) - Professional Tax

## 🎨 UI Features

- **Modern Card-Based Design**: Clean, professional HR dashboard style
- **Responsive Layout**: Works on desktop and mobile devices
- **Status Indicators**: Visual indicators for employee attendance status
- **Color-Coded Badges**: Easy identification of statuses
- **Search Functionality**: Quick search across employees, attendance, leaves
- **Date Navigation**: Easy date/month selection
- **Modal Forms**: Clean popup forms for data entry

## 🔧 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify MongoDB connection string format

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET in .env
- Ensure token is not expired

### Employee Status Not Showing
- Refresh the employees page
- Check if attendance records exist for today
- Verify employee has checked in

### Payroll Calculation Issues
- Ensure monthly wage is set correctly
- Check payroll configuration
- Verify all components are calculated

## 📝 Notes

- **Password Security**: Employees should change their temporary password on first login (feature to be added)
- **Email Verification**: Email verification is not implemented in MVP
- **File Uploads**: Profile picture and leave attachments use basic file upload (consider cloud storage for production)
- **Notifications**: Email notifications are not implemented in MVP
- **Reports Export**: Reports can be viewed but not exported (feature to be added)

## 🚀 Production Deployment

Before deploying to production:

1. **Change JWT_SECRET**: Use a strong, random secret
2. **Use Environment Variables**: Never commit .env file
3. **Enable HTTPS**: Use SSL/TLS certificates
4. **Set Up MongoDB Atlas**: Use cloud MongoDB for production
5. **Add Rate Limiting**: Prevent API abuse
6. **Enable CORS Properly**: Configure CORS for your domain
7. **Add Logging**: Implement proper logging
8. **Backup Database**: Set up regular backups
9. **Monitor Performance**: Use monitoring tools
10. **Update Dependencies**: Regularly update npm packages

## 📞 Support

For issues or questions, please contact the development team.

---

**Dayflow HRMS** - Every workday, perfectly aligned. ✨

