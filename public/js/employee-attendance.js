// Employee Attendance
let attendanceList = [];
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();

async function loadEmployeeAttendance() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 0);
        
        const [attendance, summary] = await Promise.all([
            attendanceAPI.getAll({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }),
            attendanceAPI.getSummary()
        ]);
        
        attendanceList = attendance;
        renderAttendanceView(attendance, summary);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading attendance: ${error.message}</div>`;
    }
}

async function renderAttendanceView(attendance, summary) {
    const content = document.getElementById('page-content');
    const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Get today's attendance status
    let todayAttendance = null;
    try {
        todayAttendance = await attendanceAPI.getToday();
    } catch (error) {
        console.error('Error fetching today attendance:', error);
    }
    
    content.innerHTML = `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Days Present</span>
                    <div class="card-icon success">✓</div>
                </div>
                <div class="card-value">${summary.presentDays || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Work Days</span>
                    <div class="card-icon primary">📅</div>
                </div>
                <div class="card-value">${summary.totalWorkDays || 0}</div>
            </div>
        </div>
        
        ${isToday() ? `
        <div class="attendance-actions" style="margin-bottom: 30px;">
            <div class="attendance-btn ${todayAttendance?.checkedIn ? 'checked-in' : ''}" id="checkin-btn" onclick="handleCheckIn()">
                <h3>Check IN →</h3>
                <p>${todayAttendance?.checkedIn ? `Checked in at ${new Date(todayAttendance.checkInTime).toLocaleTimeString()}` : 'Mark your attendance'}</p>
            </div>
            <div class="attendance-btn ${todayAttendance?.checkedOut ? 'checked-in' : ''}" id="checkout-btn" onclick="handleCheckOut()">
                <h3>Check Out →</h3>
                <p>${todayAttendance?.checkedOut ? `Checked out at ${new Date(todayAttendance.checkOutTime).toLocaleTimeString()}` : todayAttendance?.checkedIn ? 'Mark your checkout' : 'Check in first'}</p>
            </div>
        </div>
        ` : ''}
        
        <div class="table-container">
            <div class="table-header">
                <h2>Attendance</h2>
                <div>
                    <button class="btn btn-secondary btn-sm" onclick="changeMonth(-1)">←</button>
                    <select id="month-select" onchange="onMonthChange()" style="padding: 8px; margin: 0 10px; border: 2px solid var(--border-color); border-radius: 8px;">
                        ${Array.from({length: 12}, (_, i) => {
                            const date = new Date(selectedYear, i);
                            return `<option value="${i}" ${i === selectedMonth ? 'selected' : ''}>${date.toLocaleDateString('en-US', { month: 'long' })}</option>`;
                        }).join('')}
                    </select>
                    <button class="btn btn-secondary btn-sm" onclick="changeMonth(1)">→</button>
                    <span style="margin-left: 10px; font-weight: 500;">${monthName}</span>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Work Hours</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendance.length > 0 ? attendance.map(att => `
                        <tr>
                            <td>${new Date(att.date).toLocaleDateString()}</td>
                            <td>${att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}</td>
                            <td>${att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}</td>
                            <td>${att.workHours ? att.workHours.toFixed(2) + ' hrs' : '-'}</td>
                            <td><span class="status-badge ${getStatusClass(att.status)}">${att.status || 'Absent'}</span></td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                No attendance records for this month
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function getStatusClass(status) {
    const statusMap = {
        'Present': 'present',
        'Absent': 'absent',
        'On Leave': 'leave',
        'Half-Day': 'pending'
    };
    return statusMap[status] || 'absent';
}

function changeMonth(delta) {
    selectedMonth += delta;
    if (selectedMonth < 0) {
        selectedMonth = 11;
        selectedYear--;
    } else if (selectedMonth > 11) {
        selectedMonth = 0;
        selectedYear++;
    }
    loadEmployeeAttendance();
}

function onMonthChange() {
    const select = document.getElementById('month-select');
    selectedMonth = parseInt(select.value);
    loadEmployeeAttendance();
}

function isToday() {
    const today = new Date();
    return today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
}

async function handleCheckIn() {
    try {
        await attendanceAPI.checkIn();
        alert('Checked in successfully!');
        loadEmployeeAttendance();
    } catch (error) {
        alert('Error checking in: ' + error.message);
    }
}

async function handleCheckOut() {
    try {
        await attendanceAPI.checkOut();
        alert('Checked out successfully!');
        loadEmployeeAttendance();
    } catch (error) {
        alert('Error checking out: ' + error.message);
    }
}

