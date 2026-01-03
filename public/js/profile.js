// Profile Management (Both HR and Employee)
async function loadProfile() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const user = getCurrentUser();
        if (!user) {
            content.innerHTML = '<div class="alert alert-error">Not signed in</div>';
            return;
        }

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

        renderProfile(employee, user.role);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading profile: ${error.message}</div>`;
    }
}

function renderProfile(employee, role) {
    const content = document.getElementById('page-content');
    const isHR = role === 'HR';
    const isEmployee = role === 'Employee';
    const isEditing = !!window.profileEditing;
    
    content.innerHTML = `
        <div class="form-container">
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="employee-avatar" style="margin: 0 auto 20px; width: 120px; height: 120px; font-size: 48px;">
                    ${getEmployeeInitials(employee)}
                </div>
                <h2>${employee.firstName} ${employee.lastName}</h2>
                <p style="color: var(--text-secondary);">${employee.loginId || ''}</p>
            </div>
            
            <div class="tabs">
                <button class="tab active" onclick="switchProfileTab('basic')">Basic Info</button>
                <button class="tab" onclick="switchProfileTab('personal')">Personal Info</button>
                ${isHR ? '<button class="tab" onclick="switchProfileTab(\'salary\')">Salary Info</button>' : ''}
                <button class="tab" onclick="switchProfileTab('bank')">Bank Details</button>
            </div>
            
            <div id="profile-tab-content">
                ${renderProfileBasicInfo(employee, isHR, isEditing)}
            </div>
            
            <div class="form-actions">
                <button class="btn btn-secondary" id="profile-edit-btn" onclick="enableProfileEdit()" ${isEditing ? 'style="display:none"' : ''}>Edit Profile</button>
                <button class="btn btn-primary" id="profile-save-btn" onclick="saveProfile('${employee._id}')" ${isEditing ? '' : 'style="display:none"'}>Save Changes</button>
                <button class="btn btn-link" id="profile-cancel-btn" onclick="cancelProfileEdit()" ${isEditing ? '' : 'style="display:none"'}>Cancel</button>
            </div>
        </div>
    `;
    
    window.currentProfile = employee;
    window.currentProfileTab = 'basic';
    window.currentProfileRole = role;
}

function getEmployeeInitials(emp) {
    return (emp.firstName?.charAt(0) || '') + (emp.lastName?.charAt(0) || '');
}

function switchProfileTab(tab) {
    window.currentProfileTab = tab;
    const content = document.getElementById('profile-tab-content');
    const isHR = window.currentProfileRole === 'HR';
    const isEditing = !!window.profileEditing;
    
    if (tab === 'basic') {
        content.innerHTML = renderProfileBasicInfo(window.currentProfile, isHR, isEditing);
    } else if (tab === 'personal') {
        content.innerHTML = renderProfilePersonalInfo(window.currentProfile, isHR, isEditing);
    } else if (tab === 'salary' && isHR) {
        loadProfileSalaryInfo();
    } else if (tab === 'bank') {
        content.innerHTML = renderProfileBankInfo(window.currentProfile, isHR, isEditing);
    }
    
    // Update tab active state safely
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // find the button for this tab and add active
    const buttons = Array.from(document.querySelectorAll('.tab'));
    const btn = buttons.find(b => b.textContent.trim().toLowerCase().includes(tab));
    if (btn) btn.classList.add('active');
}

function renderProfileBasicInfo(emp, isHR, isEditing) {
    const readonlyForEmployee = !isHR && !isEditing ? 'readonly' : '';
    const disabledForEmployee = !isHR && !isEditing ? 'disabled' : '';
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Login ID</label>
                <input type="text" id="profile-loginid" value="${emp.loginId || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="profile-email" value="${emp.email || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Job Position</label>
                <input type="text" id="profile-job" value="${emp.jobPosition || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
            <div class="form-group">
                <label>Department</label>
                <input type="text" id="profile-dept" value="${emp.department || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Manager</label>
                <input type="text" id="profile-manager" value="${emp.manager || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" id="profile-location" value="${emp.location || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Company</label>
                <input type="text" id="profile-company" value="${emp.companyName || ''}" ${isHR && isEditing ? '' : 'readonly'}>
            </div>
            <div class="form-group">
                <label>Date of Joining</label>
                <input type="text" value="${emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : ''}" readonly>
            </div>
        </div>
        <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="profile-phone" value="${emp.phone || ''}" ${isEditing ? '' : 'readonly'}>
        </div>
    `;
}

function renderProfilePersonalInfo(emp, isHR, isEditing) {
    // Personal info editable by employee when in edit mode; HR can view but not edit personal fields
    const disableInputs = isHR && !isEditing ? 'disabled' : '';
    return `
        <div class="form-group">
            <label>Residing Address</label>
            <textarea id="profile-address" rows="3" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit;" ${disableInputs}>${emp.residingAddress || ''}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Nationality</label>
                <input type="text" id="profile-nationality" value="${emp.nationality || ''}" ${disableInputs}>
            </div>
            <div class="form-group">
                <label>Personal Email</label>
                <input type="email" id="profile-personal-email" value="${emp.personalEmail || ''}" ${disableInputs}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Gender</label>
                <select id="profile-gender" ${disableInputs}>
                    <option value="">Select</option>
                    <option value="Male" ${emp.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Female" ${emp.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Other" ${emp.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Marital Status</label>
                <select id="profile-marital" ${disableInputs}>
                    <option value="">Select</option>
                    <option value="Single" ${emp.maritalStatus === 'Single' ? 'selected' : ''}>Single</option>
                    <option value="Married" ${emp.maritalStatus === 'Married' ? 'selected' : ''}>Married</option>
                    <option value="Divorced" ${emp.maritalStatus === 'Divorced' ? 'selected' : ''}>Divorced</option>
                    <option value="Widowed" ${emp.maritalStatus === 'Widowed' ? 'selected' : ''}>Widowed</option>
                </select>
            </div>
        </div>
    `;
}

function renderProfileBankInfo(emp, isHR, isEditing) {
    // Bank details editable by employee when editing; HR can view but not edit
    const disableInputs = isHR && !isEditing ? 'readonly' : (isEditing ? '' : 'readonly');
    const bank = emp.bankDetails || {};
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Account Number</label>
                <input type="text" id="bank-account" value="${bank.accountNumber || ''}" ${disableInputs}>
            </div>
            <div class="form-group">
                <label>Bank Name</label>
                <input type="text" id="bank-name" value="${bank.bankName || ''}" ${disableInputs}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>IFSC Code</label>
                <input type="text" id="bank-ifsc" value="${bank.ifscCode || ''}" ${disableInputs}>
            </div>
            <div class="form-group">
                <label>PAN No</label>
                <input type="text" id="bank-pan" value="${bank.panNo || ''}" ${disableInputs}>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>UAN No</label>
                <input type="text" id="bank-uan" value="${bank.uanNo || ''}" ${disableInputs}>
            </div>
            <div class="form-group">
                <label>Emp Code</label>
                <input type="text" id="bank-empcode" value="${bank.empCode || ''}" ${disableInputs}>
            </div>
        </div>
    `;
}

async function loadProfileSalaryInfo() {
    const content = document.getElementById('profile-tab-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const user = getCurrentUser();
        const employeeId = user.employeeRef || user.employee?._id || user.employee?.id;
        const payroll = await payrollAPI.getByEmployee(employeeId);
        
        if (!payroll) {
            content.innerHTML = '<div class="alert alert-error">Payroll information not available</div>';
            return;
        }
        
        content.innerHTML = renderSalaryInfo(payroll);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading salary info: ${error.message}</div>`;
    }
}

function renderSalaryInfo(payroll) {
    return `
        <div class="form-row">
            <div class="form-group">
                <label><strong>Month Wage:</strong></label>
                <p style="font-size: 18px;">₹${(payroll.monthWage || 0).toLocaleString()} / Month</p>
            </div>
            <div class="form-group">
                <label><strong>Yearly Wage:</strong></label>
                <p style="font-size: 18px;">₹${(payroll.yearlyWage || 0).toLocaleString()} / Yearly</p>
            </div>
        </div>
        
        <h4 style="margin: 30px 0 15px 0;">Salary Components</h4>
        <table style="width: 100%; margin-bottom: 20px;">
            <tr>
                <td><strong>Basic Salary:</strong></td>
                <td>₹${(payroll.salaryComponents?.basicSalary?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.basicSalary?.percentage || 0).toFixed(2)}%</td>
            </tr>
            <tr>
                <td><strong>House Rent Allowance:</strong></td>
                <td>₹${(payroll.salaryComponents?.houseRentAllowance?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.houseRentAllowance?.percentage || 0).toFixed(2)}%</td>
            </tr>
            <tr>
                <td><strong>Standard Allowance:</strong></td>
                <td>₹${(payroll.salaryComponents?.standardAllowance?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.standardAllowance?.percentage || 0).toFixed(2)}%</td>
            </tr>
            <tr>
                <td><strong>Performance Bonus:</strong></td>
                <td>₹${(payroll.salaryComponents?.performanceBonus?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.performanceBonus?.percentage || 0).toFixed(2)}%</td>
            </tr>
            <tr>
                <td><strong>Leave Travel Allowance:</strong></td>
                <td>₹${(payroll.salaryComponents?.leaveTravelAllowance?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.leaveTravelAllowance?.percentage || 0).toFixed(2)}%</td>
            </tr>
            <tr>
                <td><strong>Fixed Allowance:</strong></td>
                <td>₹${(payroll.salaryComponents?.fixedAllowance?.amount || 0).toFixed(2)}</td>
                <td>${(payroll.salaryComponents?.fixedAllowance?.percentage || 0).toFixed(2)}%</td>
            </tr>
        </table>
        
        <div class="form-row">
            <div class="form-group">
                <label><strong>Gross Salary:</strong></label>
                <p style="font-size: 18px; font-weight: 600;">₹${(payroll.grossSalary || 0).toLocaleString()}</p>
            </div>
            <div class="form-group">
                <label><strong>Net Salary:</strong></label>
                <p style="font-size: 18px; font-weight: 600; color: var(--success-color);">₹${(payroll.netSalary || 0).toLocaleString()}</p>
            </div>
        </div>
    `;
}

function enableProfileEdit() {
    window.profileEditing = true;
    // Re-render current tab to enable inputs
    switchProfileTab(window.currentProfileTab || 'basic');
    document.getElementById('profile-edit-btn').style.display = 'none';
    document.getElementById('profile-save-btn').style.display = '';
    document.getElementById('profile-cancel-btn').style.display = '';
}

function cancelProfileEdit() {
    window.profileEditing = false;
    // Re-render profile to reset fields
    renderProfile(window.currentProfile, window.currentProfileRole);
}

async function saveProfile(id) {
    const role = window.currentProfileRole;
    const payload = {};

    try {
        if (role === 'Employee') {
            // Employees can update personal and bank details
            payload.phone = document.getElementById('profile-phone')?.value || '';
            payload.residingAddress = document.getElementById('profile-address')?.value || '';
            payload.nationality = document.getElementById('profile-nationality')?.value || '';
            payload.personalEmail = document.getElementById('profile-personal-email')?.value || '';
            payload.gender = document.getElementById('profile-gender')?.value || '';
            payload.maritalStatus = document.getElementById('profile-marital')?.value || '';
            payload.bankDetails = {
                accountNumber: document.getElementById('bank-account')?.value || '',
                bankName: document.getElementById('bank-name')?.value || '',
                ifscCode: document.getElementById('bank-ifsc')?.value || '',
                panNo: document.getElementById('bank-pan')?.value || '',
                uanNo: document.getElementById('bank-uan')?.value || '',
                empCode: document.getElementById('bank-empcode')?.value || ''
            };
        } else if (role === 'HR') {
            // HR can update basic info
            payload.email = document.getElementById('profile-email')?.value || '';
            payload.jobPosition = document.getElementById('profile-job')?.value || '';
            payload.department = document.getElementById('profile-dept')?.value || '';
            payload.manager = document.getElementById('profile-manager')?.value || '';
            payload.location = document.getElementById('profile-location')?.value || '';
            payload.companyName = document.getElementById('profile-company')?.value || '';
            // HR should not change personal/bank via this UI
        }

        await employeesAPI.update(id, payload);
        alert('Profile updated successfully!');
        window.profileEditing = false;
        // Refresh profile
        await loadProfile();
    } catch (error) {
        alert('Error updating profile: ' + error.message);
    }
}

