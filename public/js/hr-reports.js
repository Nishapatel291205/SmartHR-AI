// HR Reports
async function loadHRReports() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const [attendanceReport, leavesReport, payrollReport] = await Promise.all([
            reportsAPI.getAttendance(),
            reportsAPI.getLeaves(),
            reportsAPI.getPayroll()
        ]);
        
        renderReports(attendanceReport, leavesReport, payrollReport);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading reports: ${error.message}</div>`;
    }
}

function renderReports(attendanceReport, leavesReport, payrollReport) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div class="tabs">
            <button class="tab active" onclick="switchReportTab('attendance')">Attendance Report</button>
            <button class="tab" onclick="switchReportTab('leaves')">Leaves Report</button>
            <button class="tab" onclick="switchReportTab('payroll')">Payroll Report</button>
        </div>
        
        <div id="report-content">
            ${renderAttendanceReport(attendanceReport)}
        </div>
    `;
    
    window.currentReportTab = 'attendance';
    window.reportsData = {
        attendance: attendanceReport,
        leaves: leavesReport,
        payroll: payrollReport
    };
}

function switchReportTab(tab) {
    window.currentReportTab = tab;
    const content = document.getElementById('report-content');
    
    if (tab === 'attendance') {
        content.innerHTML = renderAttendanceReport(window.reportsData.attendance);
    } else if (tab === 'leaves') {
        content.innerHTML = renderLeavesReport(window.reportsData.leaves);
    } else if (tab === 'payroll') {
        content.innerHTML = renderPayrollReport(window.reportsData.payroll);
    }
    
    // Update tab active state
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

function renderAttendanceReport(report) {
    const summary = report.summary || {};
    const data = report.data || [];
    
    return `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Records</span>
                    <div class="card-icon primary">📊</div>
                </div>
                <div class="card-value">${summary.totalRecords || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Present</span>
                    <div class="card-icon success">✓</div>
                </div>
                <div class="card-value">${summary.present || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Absent</span>
                    <div class="card-icon danger">✗</div>
                </div>
                <div class="card-value">${summary.absent || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">On Leave</span>
                    <div class="card-icon warning">🏖️</div>
                </div>
                <div class="card-value">${summary.onLeave || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Work Hours</span>
                    <div class="card-icon primary">⏰</div>
                </div>
                <div class="card-value">${(summary.totalWorkHours || 0).toFixed(1)} hrs</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Extra Hours</span>
                    <div class="card-icon warning">➕</div>
                </div>
                <div class="card-value">${(summary.totalExtraHours || 0).toFixed(1)} hrs</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>Attendance Records</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Work Hours</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length > 0 ? data.map(att => `
                        <tr>
                            <td>${att.employee?.firstName || ''} ${att.employee?.lastName || ''}</td>
                            <td>${new Date(att.date).toLocaleDateString()}</td>
                            <td>${att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}</td>
                            <td>${att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}</td>
                            <td>${att.workHours ? att.workHours.toFixed(2) + ' hrs' : '-'}</td>
                            <td><span class="status-badge ${getStatusClass(att.status)}">${att.status || 'Absent'}</span></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 40px;">No records found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderLeavesReport(report) {
    const summary = report.summary || {};
    const data = report.data || [];
    
    return `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Requests</span>
                    <div class="card-icon primary">📊</div>
                </div>
                <div class="card-value">${summary.total || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Pending</span>
                    <div class="card-icon warning">⏳</div>
                </div>
                <div class="card-value">${summary.pending || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Approved</span>
                    <div class="card-icon success">✓</div>
                </div>
                <div class="card-value">${summary.approved || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Rejected</span>
                    <div class="card-icon danger">✗</div>
                </div>
                <div class="card-value">${summary.rejected || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Days</span>
                    <div class="card-icon primary">📅</div>
                </div>
                <div class="card-value">${summary.totalDays || 0}</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>Leave Requests</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length > 0 ? data.map(leave => `
                        <tr>
                            <td>${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}</td>
                            <td>${leave.timeOffType}</td>
                            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                            <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                            <td>${leave.allocation}</td>
                            <td><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status}</span></td>
                        </tr>
                    `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 40px;">No records found</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderPayrollReport(report) {
    const summary = report.summary || {};
    const data = report.data || [];
    
    return `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Employees</span>
                    <div class="card-icon primary">👥</div>
                </div>
                <div class="card-value">${summary.totalEmployees || 0}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Monthly Wage</span>
                    <div class="card-icon primary">₹</div>
                </div>
                <div class="card-value">₹${(summary.totalMonthlyWage || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Yearly Wage</span>
                    <div class="card-icon primary">₹</div>
                </div>
                <div class="card-value">₹${(summary.totalYearlyWage || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Gross Salary</span>
                    <div class="card-icon primary">₹</div>
                </div>
                <div class="card-value">₹${(summary.totalGrossSalary || 0).toLocaleString()}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Total Net Salary</span>
                    <div class="card-icon success">₹</div>
                </div>
                <div class="card-value">₹${(summary.totalNetSalary || 0).toLocaleString()}</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>Payroll Summary</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Monthly Wage</th>
                        <th>Gross Salary</th>
                        <th>Net Salary</th>
                        <th>PF Contribution</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length > 0 ? data.map(payroll => `
                        <tr>
                            <td>${payroll.employee?.firstName || ''} ${payroll.employee?.lastName || ''}</td>
                            <td>₹${(payroll.monthWage || 0).toLocaleString()}</td>
                            <td>₹${(payroll.grossSalary || 0).toLocaleString()}</td>
                            <td>₹${(payroll.netSalary || 0).toLocaleString()}</td>
                            <td>₹${((payroll.providentFund?.employee?.amount || 0) + (payroll.providentFund?.employer?.amount || 0)).toLocaleString()}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 40px;">No records found</td></tr>'}
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

function getLeaveStatusClass(status) {
    const statusMap = {
        'Pending': 'pending',
        'Approved': 'approved',
        'Rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
}

