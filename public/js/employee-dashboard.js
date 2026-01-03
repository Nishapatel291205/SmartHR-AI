// Employee Dashboard
async function loadEmployeeDashboard() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const user = getCurrentUser();
        let employee = user?.employee;
        let employeeId = null;
        
        // Normalize employee id/reference
        if (user?.employeeRef) {
            employeeId = user.employeeRef._id ? user.employeeRef._id : user.employeeRef;
        } else if (user?.employee?._id) {
            employeeId = user.employee._id;
            employee = user.employee;
        } else if (user?.employee?.id) {
            employeeId = user.employee.id;
            employee = user.employee;
        }
        
        // If employee object is not present but we have id, fetch full record
        if (!employee && employeeId) {
            employee = await employeesAPI.getById(employeeId);
        }
        
        if (!employee) {
            content.innerHTML = '<div class="alert alert-error">Employee profile not found</div>';
            return;
        }
        
        const [attendanceSummary, leaveSummary, todayAttendance] = await Promise.all([
            attendanceAPI.getSummary(employeeId),
            leavesAPI.getSummary(employeeId),
            attendanceAPI.getToday()
        ]);
        
        renderEmployeeDashboard(employee, attendanceSummary, leaveSummary, todayAttendance || {});
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading dashboard: ${error.message}</div>`;
    }
}

function renderEmployeeDashboard(employee, attendanceSummary, leaveSummary, todayAttendance) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div class="card-grid">
            <div class="card" onclick="navigate('profile')" style="cursor: pointer;">
                <div class="card-header">
                    <span class="card-title">My Profile</span>
                    <div class="card-icon primary">👤</div>
                </div>
                <div class="card-value">${employee.firstName} ${employee.lastName}</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">${employee.jobPosition || 'Employee'}</p>
            </div>
            <div class="card" onclick="navigate('attendance')" style="cursor: pointer;">
                <div class="card-header">
                    <span class="card-title">Attendance</span>
                    <div class="card-icon success">⏰</div>
                </div>
                <div class="card-value">${attendanceSummary.presentDays || 0} / ${attendanceSummary.totalWorkDays || 0}</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">Days Present / Total Days</p>
            </div>
            <div class="card" onclick="navigate('leaves')" style="cursor: pointer;">
                <div class="card-header">
                    <span class="card-title">Leave Balance</span>
                    <div class="card-icon warning">🏖️</div>
                </div>
                <div class="card-value">${leaveSummary.paidTimeOff?.available || 0}</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">Paid Time Off Available</p>
            </div>
            <div class="card" onclick="navigate('payroll')" style="cursor: pointer;">
                <div class="card-header">
                    <span class="card-title">Payroll</span>
                    <div class="card-icon primary">💰</div>
                </div>
                <div class="card-value">View</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">Salary Information</p>
            </div>
        </div>
        
        <div class="attendance-actions" style="margin-top: 30px;">
            <div class="attendance-btn ${todayAttendance?.checkedIn ? 'checked-in' : ''}" id="checkin-btn" onclick="handleCheckIn()">
                <h3>Check IN →</h3>
                <p>${todayAttendance?.checkedIn ? `Checked in at ${new Date(todayAttendance.checkInTime).toLocaleTimeString()}` : 'Mark your attendance'}</p>
            </div>
            <div class="attendance-btn ${todayAttendance?.checkedOut ? 'checked-in' : ''}" id="checkout-btn" onclick="handleCheckOut()">
                <h3>Check Out →</h3>
                <p>${todayAttendance?.checkedOut ? `Checked out at ${new Date(todayAttendance.checkOutTime).toLocaleTimeString()}` : todayAttendance?.checkedIn ? 'Mark your checkout' : 'Check in first'}</p>
            </div>
        </div>
        
        <div class="table-container" style="margin-top: 30px;">
            <div class="table-header">
                <h2>Recent Activity</h2>
            </div>
            <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
                Welcome to Dayflow HRMS! Use the navigation menu to manage your profile, attendance, leaves, and view payroll.
            </p>
        </div>
    `;
    
    window.todayAttendance = todayAttendance;
}

async function handleCheckIn() {
    if (window.todayAttendance && window.todayAttendance.checkedIn) {
        alert('You have already checked in today!');
        return;
    }
    
    try {
        await attendanceAPI.checkIn();
        alert('Checked in successfully!');
        loadEmployeeDashboard();
    } catch (error) {
        alert('Error checking in: ' + error.message);
    }
}

async function handleCheckOut() {
    if (!window.todayAttendance || !window.todayAttendance.checkedIn) {
        alert('Please check in first!');
        return;
    }
    
    if (window.todayAttendance.checkedOut) {
        alert('You have already checked out today!');
        return;
    }
    
    try {
        await attendanceAPI.checkOut();
        alert('Checked out successfully!');
        loadEmployeeDashboard();
    } catch (error) {
        alert('Error checking out: ' + error.message);
    }
}

