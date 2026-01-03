// Employee Leave Management
let leavesList = [];

async function loadEmployeeLeaves() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const [leaves, summary] = await Promise.all([
            leavesAPI.getAll(),
            leavesAPI.getSummary()
        ]);
        
        leavesList = leaves;
        renderLeavesView(leaves, summary);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading leaves: ${error.message}</div>`;
    }
}

function renderLeavesView(leaves, summary) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Paid Time Off</span>
                    <div class="card-icon primary">🏖️</div>
                </div>
                <div class="card-value">${summary.paidTimeOff?.available || 0}</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">${summary.paidTimeOff?.used || 0} / ${summary.paidTimeOff?.total || 0} days used</p>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Sick Leave</span>
                    <div class="card-icon warning">🏥</div>
                </div>
                <div class="card-value">${summary.sickLeave?.available || 0}</div>
                <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">${summary.sickLeave?.used || 0} / ${summary.sickLeave?.total || 0} days used</p>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>My Leave Requests</h2>
                <button class="btn btn-primary btn-sm" onclick="showApplyLeaveModal()">+ Apply for Leave</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Time Off Type</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaves.length > 0 ? leaves.map(leave => `
                        <tr>
                            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                            <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                            <td>${leave.timeOffType}</td>
                            <td>${leave.allocation} days</td>
                            <td><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status}</span></td>
                            <td>
                                ${leave.status === 'Pending' ? `
                                    <button class="btn btn-sm btn-danger" onclick="deleteLeave('${leave._id}')">Delete</button>
                                ` : ''}
                                <button class="btn btn-sm btn-secondary" onclick="viewLeave('${leave._id}')">View</button>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                No leave requests found
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function getLeaveStatusClass(status) {
    const statusMap = {
        'Pending': 'pending',
        'Approved': 'approved',
        'Rejected': 'rejected'
    };
    return statusMap[status] || 'pending';
}

function showApplyLeaveModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'apply-leave-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Apply for Leave</h2>
                <button class="modal-close" onclick="closeModal('apply-leave-modal')">&times;</button>
            </div>
            <form id="apply-leave-form">
                <div class="form-group">
                    <label>Time Off Type *</label>
                    <select id="leave-type" required>
                        <option value="">Select Type</option>
                        <option value="Paid Time Off">Paid Time Off</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Unpaid Leaves">Unpaid Leaves</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date *</label>
                        <input type="date" id="leave-start" required>
                    </div>
                    <div class="form-group">
                        <label>End Date *</label>
                        <input type="date" id="leave-end" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Reason</label>
                    <textarea id="leave-reason" rows="4" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit;"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('apply-leave-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('apply-leave-form').addEventListener('submit', handleApplyLeave);
}

async function handleApplyLeave(e) {
    e.preventDefault();
    
    const data = {
        timeOffType: document.getElementById('leave-type').value,
        startDate: document.getElementById('leave-start').value,
        endDate: document.getElementById('leave-end').value,
        reason: document.getElementById('leave-reason').value
    };
    
    try {
        await leavesAPI.create(data);
        closeModal('apply-leave-modal');
        loadEmployeeLeaves();
    } catch (error) {
        alert('Error applying for leave: ' + error.message);
    }
}

async function deleteLeave(id) {
    if (!confirm('Are you sure you want to delete this leave request?')) {
        return;
    }
    
    try {
        await leavesAPI.delete(id);
        loadEmployeeLeaves();
    } catch (error) {
        alert('Error deleting leave: ' + error.message);
    }
}

async function viewLeave(id) {
    const leave = leavesList.find(l => l._id === id);
    if (!leave) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'view-leave-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Leave Request Details</h2>
                <button class="modal-close" onclick="closeModal('view-leave-modal')">&times;</button>
            </div>
            <div style="padding: 20px 0;">
                <div class="form-group">
                    <label><strong>Time Off Type:</strong></label>
                    <p>${leave.timeOffType}</p>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label><strong>Start Date:</strong></label>
                        <p>${new Date(leave.startDate).toLocaleDateString()}</p>
                    </div>
                    <div class="form-group">
                        <label><strong>End Date:</strong></label>
                        <p>${new Date(leave.endDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="form-group">
                    <label><strong>Allocation:</strong></label>
                    <p>${leave.allocation} days</p>
                </div>
                <div class="form-group">
                    <label><strong>Reason:</strong></label>
                    <p>${leave.reason || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label><strong>Status:</strong></label>
                    <p><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status}</span></p>
                </div>
                ${leave.reviewComments ? `
                    <div class="form-group">
                        <label><strong>Review Comments:</strong></label>
                        <p>${leave.reviewComments}</p>
                    </div>
                ` : ''}
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('view-leave-modal')">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

