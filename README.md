# Dayflow - Human Resource Management System

A comprehensive HRMS built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### Authentication & Authorization
- Secure sign up and sign in
- JWT-based authentication
- Role-based access control (HR/Admin & Employee)
- Auto-generated login IDs

### HR/Admin Module
- **Dashboard**: Overview with summary cards
- **Employee Management**: Create, view, edit employees
- **Attendance Management**: View and manage all employee attendance
- **Leave Approval**: Approve/reject leave requests
- **Payroll Management**: Create and manage employee payroll
- **Reports**: Attendance, leaves, and payroll reports

### Employee Module
- **Dashboard**: Personal overview with quick actions
- **Profile Management**: View and edit personal information
- **Attendance**: Check-in/check-out and view attendance records
- **Leave Management**: Apply for leaves and track status
- **Payroll View**: View salary information (read-only)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd SmartHR-AI
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and update MongoDB URI and JWT secret
```

4. Start MongoDB (if running locally)
```bash
# Make sure MongoDB is running on localhost:27017
# Or update MONGODB_URI in .env
```

5. Start the server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

6. Open your browser
```
http://localhost:3000
```

## Usage

### First Time Setup

1. **Sign Up as HR**: 
   - Go to Sign Up page
   - Select role as "HR / Admin"
   - Fill in company name, name, email, and password
   - Login ID will be auto-generated

2. **Create Employees**:
   - Login as HR
   - Navigate to Employees
   - Click "New Employee"
   - Fill in employee details
   - System will auto-generate login ID and temporary password
   - Share credentials with employee

3. **Employee Login**:
   - Employees can login with their email and temporary password
   - They should change password on first login (feature to be added)

### Login ID Format

Login IDs are auto-generated in the format:
`[CompanyCode][First2Last2][Year][Serial]`

Example: `OIJOD020220001`
- `OI` - Company code (first 2 letters)
- `JODO` - First 2 letters of first and last name
- `2022` - Year of joining (last 2 digits)
- `0001` - Serial number

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees (HR only)
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee (HR only)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check in (Employee only)
- `POST /api/attendance/checkout` - Check out (Employee only)
- `GET /api/attendance/today` - Get today's attendance (Employee only)
- `GET /api/attendance/summary/:employeeId?` - Get attendance summary

### Leaves
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Apply for leave (Employee only)
- `PUT /api/leaves/:id/approve` - Approve/reject leave (HR only)
- `DELETE /api/leaves/:id` - Delete leave request

### Payroll
- `GET /api/payroll` - Get payroll records
- `GET /api/payroll/employee/:employeeId` - Get employee payroll
- `POST /api/payroll` - Create/update payroll (HR only)
- `PUT /api/payroll/:id` - Update payroll (HR only)

### Reports
- `GET /api/reports/dashboard` - Dashboard summary (HR only)
- `GET /api/reports/attendance` - Attendance report (HR only)
- `GET /api/reports/leaves` - Leaves report (HR only)
- `GET /api/reports/payroll` - Payroll report (HR only)

## Project Structure

```
SmartHR-AI/
├── models/          # MongoDB schemas
│   ├── User.js
│   ├── Employee.js
│   ├── Attendance.js
│   ├── LeaveRequest.js
│   └── Payroll.js
├── routes/          # API routes
│   ├── auth.js
│   ├── employees.js
│   ├── attendance.js
│   ├── leaves.js
│   ├── payroll.js
│   └── reports.js
├── middleware/       # Authentication middleware
│   └── auth.js
├── utils/           # Utility functions
│   ├── loginIdGenerator.js
│   └── payrollCalculator.js
├── public/          # Frontend files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── app.js
│   │   ├── profile.js
│   │   ├── hr-*.js
│   │   └── employee-*.js
│   └── index.html
├── server.js        # Main server file
├── package.json
└── README.md
```

## Security Notes

- Change JWT_SECRET in production
- Use strong passwords
- Implement rate limiting in production
- Use HTTPS in production
- Regularly update dependencies

## License

ISC

## Support

For issues and questions, please contact the development team.

