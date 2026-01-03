// HR Leave Management
let leavesList = [];

async function loadHRLeaves() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const leaves = await leavesAPI.getAll();
        leavesList = leaves;
        renderLeavesTable(leaves);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading leaves: ${error.message}</div>`;
    }
}

function renderLeavesTable(leaves) {
    const content = document.getElementById('page-content');
    
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    const approvedLeaves = leaves.filter(l => l.status === 'Approved');
    const rejectedLeaves = leaves.filter(l => l.status === 'Rejected');
    
    content.innerHTML = `
        <div class="card-grid" style="margin-bottom: 30px;">
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Pending</span>
                    <div class="card-icon warning">⏳</div>
                </div>
                <div class="card-value">${pendingLeaves.length}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Approved</span>
                    <div class="card-icon success">✓</div>
                </div>
                <div class="card-value">${approvedLeaves.length}</div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Rejected</span>
                    <div class="card-icon danger">✗</div>
                </div>
                <div class="card-value">${rejectedLeaves.length}</div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <h2>Leave Requests</h2>
                <input type="text" class="search-box" id="leaves-search" placeholder="Search..." onkeyup="filterLeaves()">
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Time Off Type</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="leaves-tbody">
                    ${leaves.length > 0 ? leaves.map(leave => `
                        <tr>
                            <td>
                                <strong>${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}</strong><br>
                                <small style="color: var(--text-secondary);">${leave.employee?.email || ''}</small>
                            </td>
                            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                            <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                            <td>${leave.timeOffType}</td>
                            <td>${leave.allocation} days</td>
                            <td><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status}</span></td>
                            <td>
                                ${leave.status === 'Pending' ? `
                                    <button class="btn btn-sm btn-success" onclick="approveLeave('${leave._id}')">Approve</button>
                                    <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave._id}')">Reject</button>
                                ` : `
                                    <button class="btn btn-sm btn-secondary" onclick="viewLeave('${leave._id}')">View</button>
                                `}
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
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

function filterLeaves() {
    const searchTerm = document.getElementById('leaves-search').value.toLowerCase();
    const filtered = leavesList.filter(leave => 
        `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.toLowerCase().includes(searchTerm) ||
        leave.employee?.email?.toLowerCase().includes(searchTerm) ||
        leave.timeOffType?.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('leaves-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.length > 0 ? filtered.map(leave => `
            <tr>
                <td>
                    <strong>${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}</strong><br>
                    <small style="color: var(--text-secondary);">${leave.employee?.email || ''}</small>
                </td>
                <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                <td>${leave.timeOffType}</td>
                <td>${leave.allocation} days</td>
                <td><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status}</span></td>
                <td>
                    ${leave.status === 'Pending' ? `
                        <button class="btn btn-sm btn-success" onclick="approveLeave('${leave._id}')">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="rejectLeave('${leave._id}')">Reject</button>
                    ` : `
                        <button class="btn btn-sm btn-secondary" onclick="viewLeave('${leave._id}')">View</button>
                    `}
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

async function approveLeave(id) {
    const comments = prompt('Add comments (optional):');
    try {
        await leavesAPI.approve(id, 'Approved', comments || '');
        loadHRLeaves();
    } catch (error) {
        alert('Error approving leave: ' + error.message);
    }
}

async function rejectLeave(id) {
    const comments = prompt('Reason for rejection (required):');
    if (!comments) {
        alert('Please provide a reason for rejection');
        return;
    }
    try {
        await leavesAPI.approve(id, 'Rejected', comments);
        loadHRLeaves();
    } catch (error) {
        alert('Error rejecting leave: ' + error.message);
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
                    <label><strong>Employee:</strong></label>
                    <p>${leave.employee?.firstName} ${leave.employee?.lastName} (${leave.employee?.email})</p>
                </div>
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

