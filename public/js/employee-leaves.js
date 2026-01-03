// Employee Leave Management
let leavesList = [];

async function loadEmployeeLeaves() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        let [leaves, summary] = await Promise.all([
            leavesAPI.getAll(),
            leavesAPI.getSummary()
        ]);
        
        // Defensive: handle responses that return an object instead of array
        if (!Array.isArray(leaves)) {
            if (leaves && leaves.leaveRequest) {
                leaves = [leaves.leaveRequest];
            } else if (leaves && Array.isArray(leaves.leaves)) {
                leaves = leaves.leaves;
            } else if (leaves && leaves.data && Array.isArray(leaves.data)) {
                leaves = leaves.data;
            } else {
                // If unknown shape, log and fall back to empty
                console.warn('Unexpected leaves response shape:', leaves);
                leaves = [];
            }
        }
        
        // Ensure summary is an object with expected shape
        if (!summary || typeof summary !== 'object') {
            console.warn('Unexpected leave summary response:', summary);
            summary = {
                paidTimeOff: { total: 24, used: 0, available: 24 },
                sickLeave: { total: 7, used: 0, available: 7 }
            };
        }
        
        leavesList = leaves;
        renderLeavesView(leaves, summary);
    } catch (error) {
        console.error('Error loading leaves:', error);
        content.innerHTML = `<div class="alert alert-error">Error loading leaves: ${error.message}</div>`;
    }
}

function renderLeavesView(leaves, summary) {
    const content = document.getElementById('page-content');
    
    // Guard values
    leaves = Array.isArray(leaves) ? leaves : [];
    summary = summary || { paidTimeOff: { total: 24, used: 0, available: 24 }, sickLeave: { total: 7, used: 0, available: 7 } };
    
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
                            <td>${leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}</td>
                            <td>${leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}</td>
                            <td>${leave.timeOffType || 'N/A'}</td>
                            <td>${leave.allocation || 0} days</td>
                            <td><span class="status-badge ${getLeaveStatusClass(leave.status)}">${leave.status || 'Pending'}</span></td>
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
    const user = getCurrentUser();
    const employeeName = user?.employee ? `${user.employee.firstName || ''} ${user.employee.lastName || ''}`.trim() : 'Employee';
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'apply-leave-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Time Off Type Request</h2>
                <button class="modal-close" onclick="closeModal('apply-leave-modal')">&times;</button>
            </div>
            <form id="apply-leave-form">
                <div class="form-group">
                    <label>Employee</label>
                    <input type="text" value="${employeeName}" readonly style="background: #f5f5f5; cursor: not-allowed;">
                </div>
                <div class="form-group">
                    <label>Time off Type *</label>
                    <select id="leave-type" required onchange="toggleAttachmentField()">
                        <option value="">Select Type</option>
                        <option value="Paid Time Off">Paid Time Off</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Unpaid Leaves">Unpaid Leaves</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date *</label>
                        <input type="date" id="leave-start" required onchange="calculateDuration()">
                    </div>
                    <div class="form-group">
                        <label>End Date *</label>
                        <input type="date" id="leave-end" required onchange="calculateDuration()">
                    </div>
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" id="leave-duration" value="0 Days" readonly style="background: #f5f5f5; cursor: not-allowed;">
                </div>
                <div class="form-group" id="attachment-group" style="display: none;">
                    <label>Attachments <small style="color: var(--text-secondary);">(For sick leave certificate)</small></label>
                    <div style="display: flex; align-items: center; gap: 10px; padding: 12px; border: 2px dashed var(--border-color); border-radius: 8px; cursor: pointer;" onclick="document.getElementById('leave-attachment').click()">
                        <input type="file" id="leave-attachment" accept=".pdf,.jpg,.jpeg,.png" style="display: none;" onchange="handleFileSelect(event)">
                        <span style="font-size: 24px;">+</span>
                        <span id="attachment-text" style="color: var(--text-secondary);">Click to upload attachment</span>
                    </div>
                    <div id="attachment-preview" style="margin-top: 10px;"></div>
                </div>
                <div class="form-group">
                    <label>Reason</label>
                    <textarea id="leave-reason" rows="4" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit;"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('apply-leave-modal')">Discard</button>
                    <button type="submit" class="btn btn-primary">Submit</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('apply-leave-form').addEventListener('submit', handleApplyLeave);
    
    // Store functions on window for inline handlers
    window.toggleAttachmentField = function() {
        const leaveType = document.getElementById('leave-type').value;
        const attachmentGroup = document.getElementById('attachment-group');
        if (leaveType === 'Sick Leave') {
            attachmentGroup.style.display = 'block';
        } else {
            attachmentGroup.style.display = 'none';
            document.getElementById('leave-attachment').value = '';
            document.getElementById('attachment-preview').innerHTML = '';
            document.getElementById('attachment-text').textContent = 'Click to upload attachment';
        }
    };
    
    window.calculateDuration = function() {
        const startDate = document.getElementById('leave-start').value;
        const endDate = document.getElementById('leave-end').value;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('leave-duration').value = `${diffDays} Days`;
        } else {
            document.getElementById('leave-duration').value = '0 Days';
        }
    };
    
    window.handleFileSelect = function(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('attachment-text').textContent = file.name;
            const preview = document.getElementById('attachment-preview');
            preview.innerHTML = `<div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                <span>📎 ${file.name}</span>
                <button type="button" onclick="document.getElementById('leave-attachment').value=''; document.getElementById('attachment-text').textContent='Click to upload attachment'; this.parentElement.remove();" style="background: none; border: none; color: var(--danger-color); cursor: pointer;">×</button>
            </div>`;
        }
    };
}

async function handleApplyLeave(e) {
    e.preventDefault();
    
    const timeOffType = document.getElementById('leave-type').value;
    const startDate = document.getElementById('leave-start').value;
    const endDate = document.getElementById('leave-end').value;
    const reason = document.getElementById('leave-reason').value;
    const attachmentFile = document.getElementById('leave-attachment')?.files[0];
    
    if (!timeOffType || !startDate || !endDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        // For now, we'll send attachment filename since file upload needs backend changes
        // In a real implementation, you'd use FormData for file uploads
        const data = {
            timeOffType,
            startDate,
            endDate,
            reason: reason || '',
            attachment: attachmentFile ? attachmentFile.name : null // Store filename for now
        };
        
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
    const leave = leavesList.find(l => l._id === id) || leavesList.find(l => l._id?.toString() === id);
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
                        <p>${leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div class="form-group">
                        <label><strong>End Date:</strong></label>
                        <p>${leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
                <div class="form-group">
                    <label><strong>Allocation:</strong></label>
                    <p>${leave.allocation || 0} days</p>
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

