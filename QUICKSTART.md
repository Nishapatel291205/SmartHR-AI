# Dayflow HRMS - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create .env File
Create a `.env` file in the root directory with the following content:

```env
MONGODB_URI=mongodb://localhost:27017/dayflow_hrms
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=3000
```

**Important**: 
- If using MongoDB Atlas (cloud), replace `MONGODB_URI` with your Atlas connection string
- Change `JWT_SECRET` to a strong random string in production

### Step 3: Start MongoDB
Make sure MongoDB is running:
- **Local MongoDB**: Start `mongod` service
- **MongoDB Atlas**: No action needed, just use your connection string in `.env`

### Step 4: Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Step 5: Open Browser
Navigate to: **http://localhost:3000**

## 📋 First Time Setup

### 1. Create HR Account
1. Click **"Sign Up"** on the login page
2. Fill in:
   - Company Name (e.g., "Odoo India")
   - Your First Name and Last Name
   - Email address
   - Password
   - Select **"HR / Admin"** as role
3. Click **"Sign Up"**
4. Your Login ID will be auto-generated (e.g., `OIJOD020220001`)

### 2. Create Employee Accounts
1. Log in as HR
2. Go to **Employees** → Click **"+ New Employee"**
3. Fill in employee details
4. System generates Login ID and temporary password
5. Share credentials with employee

### 3. Employee Login
1. Employee goes to Sign In page
2. Uses email or Login ID
3. Uses temporary password
4. Can access dashboard and change password

## ✨ Key Features

### HR/Admin Features
- ✅ Dashboard with summary cards
- ✅ Employee management (add, edit, view)
- ✅ Attendance tracking for all employees
- ✅ Leave approval workflow
- ✅ Payroll management with auto-calculation
- ✅ Reports (Attendance, Leaves, Payroll)

### Employee Features
- ✅ Personal dashboard
- ✅ Profile management (limited edit)
- ✅ Check In/Check Out
- ✅ Leave application and tracking
- ✅ Payroll view (read-only)

## 🎯 Login ID Format

Auto-generated format: `[CompanyCode][First2Last2][Year][Serial]`

**Example**: `OIJOD020220001`
- `OI` = Company code (first 2 letters)
- `JODO` = First 2 letters of first + last name
- `2022` = Year of joining (last 2 digits)
- `0001` = Serial number

## 💰 Payroll Auto-Calculation

When you set a monthly wage, the system automatically calculates:
- Basic Salary (50% of wage)
- HRA (50% of Basic)
- Standard Allowance (₹4,167)
- Performance Bonus (8.33% of Basic)
- Leave Travel Allowance (8.333% of Basic)
- Fixed Allowance (remaining amount)
- Provident Fund (12% of Basic)
- Professional Tax (₹200)
- Gross & Net Salary

## 🔧 Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`
- For Atlas: Check connection string format

### Port Already in Use
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Authentication Issues
- Clear browser localStorage
- Check `JWT_SECRET` in `.env`
- Ensure token hasn't expired

## 📚 More Information

See `README.md` and `SETUP.md` for detailed documentation.

---

**Happy Managing! 🎉**

