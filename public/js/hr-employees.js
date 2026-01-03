// HR Employee Management
let employeesList = [];
let employeesStatusMap = {};

async function loadHREmployees() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const employees = await employeesAPI.getAll();
        employeesList = employees;
        
        // Fetch today's attendance for all employees
        const today = new Date().toISOString().split('T')[0];
        const attendance = await attendanceAPI.getAll({ date: today });
        
        // Create status map
        employeesStatusMap = {};
        attendance.forEach(att => {
            if (att.employee && att.employee._id) {
                employeesStatusMap[att.employee._id] = att.status || 'Absent';
            }
        });
        
        renderEmployeesList(employees);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading employees: ${error.message}</div>`;
    }
}

function renderEmployeesList(employees) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h2>All Employees</h2>
                <div>
                    <input type="text" class="search-box" id="employee-search" placeholder="Search employees..." onkeyup="filterEmployees()">
                    <button class="btn btn-primary btn-sm" onclick="showAddEmployeeModal()" style="margin-left: 10px;">+ New Employee</button>
                </div>
            </div>
            <div class="employee-grid" id="employees-grid">
                ${employees.map(emp => `
                    <div class="employee-card" onclick="viewEmployee('${emp._id}')">
                        <div class="employee-status ${getEmployeeStatus(emp)}"></div>
                        <div class="employee-avatar">
                            ${getEmployeeInitials(emp)}
                        </div>
                        <div class="employee-name">${emp.firstName} ${emp.lastName}</div>
                        <div style="text-align: center; color: var(--text-secondary); font-size: 12px;">
                            ${emp.jobPosition || 'Employee'} • ${emp.department || 'N/A'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getEmployeeInitials(emp) {
    return (emp.firstName?.charAt(0) || '') + (emp.lastName?.charAt(0) || '');
}

function getEmployeeStatus(emp) {
    const status = employeesStatusMap[emp._id];
    if (!status) return 'absent';
    
    // Map status to CSS classes
    const statusMap = {
        'Present': 'present',
        'Absent': 'absent',
        'On Leave': 'leave',
        'Half-Day': 'halfday'
    };
    return statusMap[status] || 'absent';
}

function filterEmployees() {
    const searchTerm = document.getElementById('employee-search').value.toLowerCase();
    const filtered = employeesList.filter(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.loginId?.toLowerCase().includes(searchTerm)
    );
    
    const grid = document.getElementById('employees-grid');
    if (grid) {
        grid.innerHTML = filtered.map(emp => `
            <div class="employee-card" onclick="viewEmployee('${emp._id}')">
                <div class="employee-status ${getEmployeeStatus(emp)}"></div>
                <div class="employee-avatar">
                    ${getEmployeeInitials(emp)}
                </div>
                <div class="employee-name">${emp.firstName} ${emp.lastName}</div>
                <div style="text-align: center; color: var(--text-secondary); font-size: 12px;">
                    ${emp.jobPosition || 'Employee'} • ${emp.department || 'N/A'}
                </div>
            </div>
        `).join('');
    }
}

function showAddEmployeeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'add-employee-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Employee</h2>
                <button class="modal-close" onclick="closeModal('add-employee-modal')">&times;</button>
            </div>
            <form id="add-employee-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" id="emp-firstname" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" id="emp-lastname" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="emp-email" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="emp-phone">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Company Name *</label>
                        <input type="text" id="emp-company" required>
                    </div>
                    <div class="form-group">
                        <label>Job Position</label>
                        <input type="text" id="emp-position">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="emp-department">
                    </div>
                    <div class="form-group">
                        <label>Manager</label>
                        <input type="text" id="emp-manager">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="emp-location">
                    </div>
                    <div class="form-group">
                        <label>Date of Joining</label>
                        <input type="date" id="emp-joining">
                    </div>
                </div>
                <div class="form-group">
                    <label>Monthly Wage (₹)</label>
                    <input type="number" id="emp-wage" min="0">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('add-employee-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Employee</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('add-employee-form').addEventListener('submit', handleAddEmployee);
}

async function handleAddEmployee(e) {
    e.preventDefault();
    
    const data = {
        firstName: document.getElementById('emp-firstname').value,
        lastName: document.getElementById('emp-lastname').value,
        email: document.getElementById('emp-email').value,
        phone: document.getElementById('emp-phone').value,
        companyName: document.getElementById('emp-company').value,
        jobPosition: document.getElementById('emp-position').value,
        department: document.getElementById('emp-department').value,
        manager: document.getElementById('emp-manager').value,
        location: document.getElementById('emp-location').value,
        dateOfJoining: document.getElementById('emp-joining').value,
        monthWage: document.getElementById('emp-wage').value
    };
    
    try {
        const response = await employeesAPI.create(data);
        alert(`Employee created successfully!\nLogin ID: ${response.loginId}\nTemporary Password: ${response.temporaryPassword}\n\nPlease share these credentials with the employee.`);
        closeModal('add-employee-modal');
        loadHREmployees();
    } catch (error) {
        alert('Error creating employee: ' + error.message);
    }
}

async function viewEmployee(id) {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const employee = await employeesAPI.getById(id);
        renderEmployeeView(employee);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading employee: ${error.message}</div>`;
    }
}

function renderEmployeeView(employee) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-secondary" onclick="loadHREmployees()">← Back to Employees</button>
        </div>
        <div class="form-container">
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="employee-avatar" style="margin: 0 auto 20px;">
                    ${getEmployeeInitials(employee)}
                </div>
                <h2>${employee.firstName} ${employee.lastName}</h2>
                <p style="color: var(--text-secondary);">${employee.loginId}</p>
            </div>
            
            <div class="tabs">
                <button class="tab active" onclick="switchEmployeeTab('basic')">Basic Info</button>
                <button class="tab" onclick="switchEmployeeTab('personal')">Personal Info</button>
                <button class="tab" onclick="switchEmployeeTab('bank')">Bank Details</button>
            </div>
            
            <div id="employee-tab-content">
                ${renderEmployeeBasicInfo(employee)}
            </div>
            
            <div class="form-actions">
                <button class="btn btn-primary" onclick="editEmployee('${employee._id}')">Edit Employee</button>
            </div>
        </div>
    `;
    
    window.currentEmployee = employee;
    window.currentEmployeeTab = 'basic';
}

function switchEmployeeTab(tab) {
    window.currentEmployeeTab = tab;
    const content = document.getElementById('employee-tab-content');
    
    if (tab === 'basic') {
        content.innerHTML = renderEmployeeBasicInfo(window.currentEmployee);
    } else if (tab === 'personal') {
        content.innerHTML = renderEmployeePersonalInfo(window.currentEmployee);
    } else if (tab === 'bank') {
        content.innerHTML = renderEmployeeBankInfo(window.currentEmployee);
    }
    
    // Update tab active state
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

function renderEmployeeBasicInfo(emp) {
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Login ID</label>
                <input type="text" value="${emp.loginId || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" value="${emp.email || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Job Position</label>
                <input type="text" value="${emp.jobPosition || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Department</label>
                <input type="text" value="${emp.department || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Manager</label>
                <input type="text" value="${emp.manager || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" value="${emp.location || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Company</label>
                <input type="text" value="${emp.companyName || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Date of Joining</label>
                <input type="text" value="${emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : ''}" readonly>
            </div>
        </div>
    `;
}

function renderEmployeePersonalInfo(emp) {
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Residing Address</label>
                <input type="text" value="${emp.residingAddress || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Nationality</label>
                <input type="text" value="${emp.nationality || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Personal Email</label>
                <input type="email" value="${emp.personalEmail || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Gender</label>
                <input type="text" value="${emp.gender || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Marital Status</label>
                <input type="text" value="${emp.maritalStatus || ''}" readonly>
            </div>
        </div>
    `;
}

function renderEmployeeBankInfo(emp) {
    const bank = emp.bankDetails || {};
    return `
        <div class="form-row">
            <div class="form-group">
                <label>Account Number</label>
                <input type="text" value="${bank.accountNumber || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Bank Name</label>
                <input type="text" value="${bank.bankName || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>IFSC Code</label>
                <input type="text" value="${bank.ifscCode || ''}" readonly>
            </div>
            <div class="form-group">
                <label>PAN No</label>
                <input type="text" value="${bank.panNo || ''}" readonly>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>UAN No</label>
                <input type="text" value="${bank.uanNo || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Emp Code</label>
                <input type="text" value="${bank.empCode || ''}" readonly>
            </div>
        </div>
    `;
}

async function editEmployee(id) {
    let employee = window.currentEmployee || employeesList.find(emp => emp._id === id);
    if (!employee) {
        try {
            employee = await employeesAPI.getById(id);
        } catch (error) {
            alert('Error loading employee: ' + error.message);
            return;
        }
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'edit-employee-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2>Edit Employee</h2>
                <button class="modal-close" onclick="closeModal('edit-employee-modal')">&times;</button>
            </div>
            <form id="edit-employee-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" id="edit-firstname" value="${employee.firstName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input type="text" id="edit-lastname" value="${employee.lastName || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" id="edit-email" value="${employee.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="edit-phone" value="${employee.phone || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Company Name *</label>
                        <input type="text" id="edit-company" value="${employee.companyName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Job Position</label>
                        <input type="text" id="edit-position" value="${employee.jobPosition || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" id="edit-department" value="${employee.department || ''}">
                    </div>
                    <div class="form-group">
                        <label>Manager</label>
                        <input type="text" id="edit-manager" value="${employee.manager || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="edit-location" value="${employee.location || ''}">
                    </div>
                    <div class="form-group">
                        <label>Date of Joining</label>
                        <input type="date" id="edit-joining" value="${employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Residing Address</label>
                    <textarea id="edit-address" rows="3" style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit;">${employee.residingAddress || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nationality</label>
                        <input type="text" id="edit-nationality" value="${employee.nationality || ''}">
                    </div>
                    <div class="form-group">
                        <label>Personal Email</label>
                        <input type="email" id="edit-personal-email" value="${employee.personalEmail || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="edit-gender">
                            <option value="">Select</option>
                            <option value="Male" ${employee.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${employee.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${employee.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Marital Status</label>
                        <select id="edit-marital">
                            <option value="">Select</option>
                            <option value="Single" ${employee.maritalStatus === 'Single' ? 'selected' : ''}>Single</option>
                            <option value="Married" ${employee.maritalStatus === 'Married' ? 'selected' : ''}>Married</option>
                            <option value="Divorced" ${employee.maritalStatus === 'Divorced' ? 'selected' : ''}>Divorced</option>
                            <option value="Widowed" ${employee.maritalStatus === 'Widowed' ? 'selected' : ''}>Widowed</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('edit-employee-modal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('edit-employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById('edit-firstname').value,
            lastName: document.getElementById('edit-lastname').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            companyName: document.getElementById('edit-company').value,
            jobPosition: document.getElementById('edit-position').value,
            department: document.getElementById('edit-department').value,
            manager: document.getElementById('edit-manager').value,
            location: document.getElementById('edit-location').value,
            dateOfJoining: document.getElementById('edit-joining').value,
            residingAddress: document.getElementById('edit-address').value,
            nationality: document.getElementById('edit-nationality').value,
            personalEmail: document.getElementById('edit-personal-email').value,
            gender: document.getElementById('edit-gender').value,
            maritalStatus: document.getElementById('edit-marital').value
        };
        
        try {
            await employeesAPI.update(id, data);
            closeModal('edit-employee-modal');
            viewEmployee(id);
        } catch (error) {
            alert('Error updating employee: ' + error.message);
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

