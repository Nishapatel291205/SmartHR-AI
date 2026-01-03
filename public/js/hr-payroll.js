// HR Payroll Management
let payrollList = [];

async function loadHRPayroll() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const payrolls = await payrollAPI.getAll();
        payrollList = payrolls;
        renderPayrollTable(payrolls);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading payroll: ${error.message}</div>`;
    }
}

function renderPayrollTable(payrolls) {
    const content = document.getElementById('page-content');
    
    content.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h2>Payroll Management</h2>
                <div>
                    <input type="text" class="search-box" id="payroll-search" placeholder="Search employees..." onkeyup="filterPayroll()">
                    <button class="btn btn-primary btn-sm" onclick="showAddPayrollModal()" style="margin-left: 10px;">+ Add Payroll</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Monthly Wage</th>
                        <th>Yearly Wage</th>
                        <th>Gross Salary</th>
                        <th>Net Salary</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="payroll-tbody">
                    ${payrolls.length > 0 ? payrolls.map(payroll => `
                        <tr>
                            <td>
                                <strong>${payroll.employee?.firstName || ''} ${payroll.employee?.lastName || ''}</strong><br>
                                <small style="color: var(--text-secondary);">${payroll.employee?.email || ''}</small>
                            </td>
                            <td>₹${(payroll.monthWage || 0).toLocaleString()}</td>
                            <td>₹${(payroll.yearlyWage || 0).toLocaleString()}</td>
                            <td>₹${(payroll.grossSalary || 0).toLocaleString()}</td>
                            <td>₹${(payroll.netSalary || 0).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewPayroll('${payroll._id}')">View</button>
                                <button class="btn btn-sm btn-secondary" onclick="editPayroll('${payroll._id}')">Edit</button>
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                No payroll records found
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>
    `;
}

function filterPayroll() {
    const searchTerm = document.getElementById('payroll-search').value.toLowerCase();
    const filtered = payrollList.filter(p => 
        `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase().includes(searchTerm) ||
        p.employee?.email?.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('payroll-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.length > 0 ? filtered.map(payroll => `
            <tr>
                <td>
                    <strong>${payroll.employee?.firstName || ''} ${payroll.employee?.lastName || ''}</strong><br>
                    <small style="color: var(--text-secondary);">${payroll.employee?.email || ''}</small>
                </td>
                <td>₹${(payroll.monthWage || 0).toLocaleString()}</td>
                <td>₹${(payroll.yearlyWage || 0).toLocaleString()}</td>
                <td>₹${(payroll.grossSalary || 0).toLocaleString()}</td>
                <td>₹${(payroll.netSalary || 0).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewPayroll('${payroll._id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="editPayroll('${payroll._id}')">Edit</button>
                </td>
            </tr>
        `).join('') : `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No matching records
                </td>
            </tr>
        `;
    }
}

async function showAddPayrollModal() {
    // First, get list of employees
    try {
        const employees = await employeesAPI.getAll();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'add-payroll-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Payroll</h2>
                    <button class="modal-close" onclick="closeModal('add-payroll-modal')">&times;</button>
                </div>
                <form id="add-payroll-form">
                    <div class="form-group">
                        <label>Employee *</label>
                        <select id="payroll-employee" required>
                            <option value="">Select Employee</option>
                            ${employees.map(emp => `
                                <option value="${emp._id}">${emp.firstName} ${emp.lastName} (${emp.email})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Monthly Wage (₹) *</label>
                            <input type="number" id="payroll-monthly" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Yearly Wage (₹)</label>
                            <input type="number" id="payroll-yearly" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Working Days/Week</label>
                            <input type="number" id="payroll-days" value="5" min="1" max="7">
                        </div>
                        <div class="form-group">
                            <label>Working Hours/Day</label>
                            <input type="number" id="payroll-hours" value="8" min="1" max="24">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Break Time (minutes)</label>
                        <input type="number" id="payroll-break" value="60" min="0">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('add-payroll-modal')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Payroll</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('add-payroll-form').addEventListener('submit', handleAddPayroll);
    } catch (error) {
        alert('Error loading employees: ' + error.message);
    }
}

async function handleAddPayroll(e) {
    e.preventDefault();
    
    const data = {
        employeeId: document.getElementById('payroll-employee').value,
        monthWage: parseFloat(document.getElementById('payroll-monthly').value),
        yearlyWage: parseFloat(document.getElementById('payroll-yearly').value) || null,
        workingDaysPerWeek: parseInt(document.getElementById('payroll-days').value) || 5,
        workingHoursPerDay: parseInt(document.getElementById('payroll-hours').value) || 8,
        breakTime: parseInt(document.getElementById('payroll-break').value) || 60
    };
    
    try {
        await payrollAPI.create(data);
        closeModal('add-payroll-modal');
        loadHRPayroll();
    } catch (error) {
        alert('Error creating payroll: ' + error.message);
    }
}

async function viewPayroll(id) {
    try {
        const payroll = await payrollAPI.getById(id);
        renderPayrollDetails(payroll);
    } catch (error) {
        alert('Error loading payroll: ' + error.message);
    }
}

function renderPayrollDetails(payroll) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'view-payroll-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Payroll Details</h2>
                <button class="modal-close" onclick="closeModal('view-payroll-modal')">&times;</button>
            </div>
            <div style="padding: 20px 0;">
                <h3 style="margin-bottom: 20px;">${payroll.employee?.firstName} ${payroll.employee?.lastName}</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label><strong>Month Wage:</strong></label>
                        <p>₹${(payroll.monthWage || 0).toLocaleString()} / Month</p>
                    </div>
                    <div class="form-group">
                        <label><strong>Yearly Wage:</strong></label>
                        <p>₹${(payroll.yearlyWage || 0).toLocaleString()} / Yearly</p>
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
                
                <h4 style="margin: 30px 0 15px 0;">Deductions</h4>
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr>
                        <td><strong>Provident Fund (Employee):</strong></td>
                        <td>₹${(payroll.providentFund?.employee?.amount || 0).toFixed(2)}</td>
                        <td>${(payroll.providentFund?.employee?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td><strong>Provident Fund (Employer):</strong></td>
                        <td>₹${(payroll.providentFund?.employer?.amount || 0).toFixed(2)}</td>
                        <td>${(payroll.providentFund?.employer?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td><strong>Professional Tax:</strong></td>
                        <td>₹${(payroll.professionalTax?.amount || 0).toFixed(2)}</td>
                        <td>-</td>
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
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('view-payroll-modal')">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function editPayroll(id) {
    try {
        const payroll = await payrollAPI.getById(id);
        // Similar to add but with existing values
        alert('Edit payroll functionality - implement full form');
    } catch (error) {
        alert('Error loading payroll: ' + error.message);
    }
}

