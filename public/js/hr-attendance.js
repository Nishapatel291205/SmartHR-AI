// HR Attendance Management
(function() {
let hrAttendanceList = [];
let selectedDate = new Date();

async function loadHRAttendance() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const attendance = await attendanceAPI.getAll({ date: dateStr });
        hrAttendanceList = attendance;
        renderAttendanceTable(attendance);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading attendance: ${error.message}</div>`;
    }
}

function renderAttendanceTable(attendance) {
    const content = document.getElementById('page-content');
    const dateStr = selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    content.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h2>Attendance</h2>
                <div>
                    <input type="text" class="search-box" id="attendance-search" placeholder="Search..." onkeyup="filterAttendance()">
                    <button class="btn btn-primary btn-sm" onclick="showAddAttendanceModal()" style="margin-left: 10px;">+ Add Attendance</button>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-secondary btn-sm" onclick="changeDate(-1)">←</button>
                <input type="date" id="attendance-date" value="${selectedDate.toISOString().split('T')[0]}" onchange="onDateChange()" style="padding: 8px; border: 2px solid var(--border-color); border-radius: 8px;">
                <button class="btn btn-secondary btn-sm" onclick="changeDate(1)">→</button>
                <span style="margin-left: 10px; font-weight: 500;">${dateStr}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Work Hours</th>
                        <th>Extra Hours</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="attendance-tbody">
                    ${attendance.length > 0 ? attendance.map(att => `
                        <tr>
                            <td>
                                <strong>${att.employee?.firstName || ''} ${att.employee?.lastName || ''}</strong><br>
                                <small style="color: var(--text-secondary);">${att.employee?.email || ''}</small>
                            </td>
                            <td>${att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}</td>
                            <td>${att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}</td>
                            <td>${att.workHours ? att.workHours.toFixed(2) + ' hrs' : '-'}</td>
                            <td>${att.extraHours ? att.extraHours.toFixed(2) + ' hrs' : '-'}</td>
                            <td><span class="status-badge ${getStatusClass(att.status)}">${att.status || 'Absent'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editAttendance('${att._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                No attendance records for this date
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

function changeDate(days) {
    selectedDate.setDate(selectedDate.getDate() + days);
    loadHRAttendance();
}

function onDateChange() {
    const dateInput = document.getElementById('attendance-date');
    selectedDate = new Date(dateInput.value);
    loadHRAttendance();
}

function filterAttendance() {
    const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
    const filtered = hrAttendanceList.filter(att => 
        `${att.employee?.firstName || ''} ${att.employee?.lastName || ''}`.toLowerCase().includes(searchTerm) ||
        att.employee?.email?.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('attendance-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.length > 0 ? filtered.map(att => `
            <tr>
                <td>
                    <strong>${att.employee?.firstName || ''} ${att.employee?.lastName || ''}</strong><br>
                    <small style="color: var(--text-secondary);">${att.employee?.email || ''}</small>
                </td>
                <td>${att.checkIn ? new Date(att.checkIn).toLocaleTimeString() : '-'}</td>
                <td>${att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : '-'}</td>
                <td>${att.workHours ? att.workHours.toFixed(2) + ' hrs' : '-'}</td>
                <td>${att.extraHours ? att.extraHours.toFixed(2) + ' hrs' : '-'}</td>
                <td><span class="status-badge ${getStatusClass(att.status)}">${att.status || 'Absent'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editAttendance('${att._id}')">Edit</button>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No matching records
                </td>
            </tr>
        `;
    }
}

async function editAttendance(id) {
    const attendance = hrAttendanceList.find(a => a._id === id);
    if (!attendance) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'edit-attendance-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Attendance</h2>
                <button class="modal-close" onclick="closeModal('edit-attendance-modal')">&times;</button>
            </div>
            <form id="edit-attendance-form">
                <div class="form-group">
                    <label>Employee</label>
                    <input type="text" value="${attendance.employee?.firstName} ${attendance.employee?.lastName}" readonly>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="text" value="${new Date(attendance.date).toLocaleDateString()}" readonly>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="att-status">
                        <option value="Present" ${attendance.status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Absent" ${attendance.status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Half-Day" ${attendance.status === 'Half-Day' ? 'selected' : ''}>Half-Day</option>
                        <option value="On Leave" ${attendance.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Check In Time</label>
                    <input type="time" id="att-checkin" value="${attendance.checkIn ? new Date(attendance.checkIn).toTimeString().slice(0,5) : ''}">
                </div>
                <div class="form-group">
                    <label>Check Out Time</label>
                    <input type="time" id="att-checkout" value="${attendance.checkOut ? new Date(attendance.checkOut).toTimeString().slice(0,5) : ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-attendance-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('edit-attendance-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('att-status').value;
        const checkIn = document.getElementById('att-checkin').value;
        const checkOut = document.getElementById('att-checkout').value;
        
        const updateData = { status };
        if (checkIn) {
            const date = new Date(attendance.date);
            const [hours, minutes] = checkIn.split(':');
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            updateData.checkIn = date;
        }
        if (checkOut) {
            const date = new Date(attendance.date);
            const [hours, minutes] = checkOut.split(':');
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            updateData.checkOut = date;
        }
        
        try {
            await attendanceAPI.update(id, updateData);
            closeModal('edit-attendance-modal');
            loadHRAttendance();
        } catch (error) {
            alert('Error updating attendance: ' + error.message);
        }
    });
}

async function showAddAttendanceModal() {
    try {
        const employees = await employeesAPI.getAll();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'add-attendance-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Attendance</h2>
                    <button class="modal-close" onclick="closeModal('add-attendance-modal')">&times;</button>
                </div>
                <form id="add-attendance-form">
                    <div class="form-group">
                        <label>Employee *</label>
                        <select id="att-employee" required>
                            <option value="">Select Employee</option>
                            ${employees.map(emp => `
                                <option value="${emp._id}">${emp.firstName} ${emp.lastName} (${emp.email})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date *</label>
                        <input type="date" id="att-date" value="${selectedDate.toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select id="att-status" required>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half-Day">Half-Day</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Check In Time</label>
                        <input type="time" id="att-checkin">
                    </div>
                    <div class="form-group">
                        <label>Check Out Time</label>
                        <input type="time" id="att-checkout">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('add-attendance-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Attendance</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('add-attendance-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                employeeId: document.getElementById('att-employee').value,
                date: document.getElementById('att-date').value,
                status: document.getElementById('att-status').value,
                checkIn: document.getElementById('att-checkin').value || null,
                checkOut: document.getElementById('att-checkout').value || null
            };
            
            try {
                await attendanceAPI.create(data);
                closeModal('add-attendance-modal');
                loadHRAttendance();
            } catch (error) {
                alert('Error adding attendance: ' + error.message);
            }
        });
    } catch (error) {
        alert('Error loading employees: ' + error.message);
    }
}
})();

