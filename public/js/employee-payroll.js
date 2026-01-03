// Employee Payroll View
async function loadEmployeePayroll() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const user = getCurrentUser();
        if (!user || !user.employee) {
            content.innerHTML = '<div class="alert alert-error">Employee profile not found</div>';
            return;
        }
        
        const payroll = await payrollAPI.getByEmployee(user.employee._id || user.employee.id);
        renderPayrollView(payroll);
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading payroll: ${error.message}</div>`;
    }
}

function renderPayrollView(payroll) {
    const content = document.getElementById('page-content');
    
    if (!payroll) {
        content.innerHTML = `
            <div class="alert alert-error">
                Payroll information not available. Please contact HR.
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="form-container">
            <h2 style="margin-bottom: 30px; text-align: center;">Salary Information</h2>
            
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
            
            <div class="form-row">
                <div class="form-group">
                    <label><strong>No of working days in a week:</strong></label>
                    <p>${payroll.workingDaysPerWeek || 5} days</p>
                </div>
                <div class="form-group">
                    <label><strong>Break Time:</strong></label>
                    <p>${payroll.breakTime || 60} minutes</p>
                </div>
            </div>
            
            <h3 style="margin: 40px 0 20px 0; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Salary Components</h3>
            
            <table style="width: 100%; margin-bottom: 30px;">
                <thead>
                    <tr style="background: var(--bg-color);">
                        <th style="padding: 12px; text-align: left;">Component</th>
                        <th style="padding: 12px; text-align: right;">Amount</th>
                        <th style="padding: 12px; text-align: right;">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>Basic Salary</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.basicSalary?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.basicSalary?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.basicSalary?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>House Rent Allowance</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.houseRentAllowance?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.houseRentAllowance?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.houseRentAllowance?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>Standard Allowance</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.standardAllowance?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.standardAllowance?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.standardAllowance?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>Performance Bonus</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.performanceBonus?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.performanceBonus?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.performanceBonus?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>Leave Travel Allowance</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.leaveTravelAllowance?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.leaveTravelAllowance?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.leaveTravelAllowance?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;">
                            <strong>Fixed Allowance</strong><br>
                            <small style="color: var(--text-secondary);">${payroll.salaryComponents?.fixedAllowance?.description || ''}</small>
                        </td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.salaryComponents?.fixedAllowance?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.salaryComponents?.fixedAllowance?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                </tbody>
            </table>
            
            <h3 style="margin: 40px 0 20px 0; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Provident Fund (PF) Contribution</h3>
            
            <table style="width: 100%; margin-bottom: 30px;">
                <thead>
                    <tr style="background: var(--bg-color);">
                        <th style="padding: 12px; text-align: left;">Type</th>
                        <th style="padding: 12px; text-align: right;">Amount</th>
                        <th style="padding: 12px; text-align: right;">Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px;"><strong>Employee</strong><br><small style="color: var(--text-secondary);">PF is calculated based on the basic salary</small></td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.providentFund?.employee?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.providentFund?.employee?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px;"><strong>Employer</strong><br><small style="color: var(--text-secondary);">PF is calculated based on the basic salary</small></td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.providentFund?.employer?.amount || 0).toFixed(2)}</td>
                        <td style="padding: 12px; text-align: right;">${(payroll.providentFund?.employer?.percentage || 0).toFixed(2)}%</td>
                    </tr>
                </tbody>
            </table>
            
            <h3 style="margin: 40px 0 20px 0; border-bottom: 2px solid var(--border-color); padding-bottom: 10px;">Tax Deductions</h3>
            
            <table style="width: 100%; margin-bottom: 30px;">
                <thead>
                    <tr style="background: var(--bg-color);">
                        <th style="padding: 12px; text-align: left;">Type</th>
                        <th style="padding: 12px; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 12px;"><strong>Professional Tax</strong><br><small style="color: var(--text-secondary);">Professional Tax deducted from the Gross salary</small></td>
                        <td style="padding: 12px; text-align: right;">₹${(payroll.professionalTax?.amount || 0).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="form-row" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <div class="form-group">
                    <label><strong>Gross Salary:</strong></label>
                    <p style="font-size: 24px; font-weight: 700; color: var(--text-primary);">₹${(payroll.grossSalary || 0).toLocaleString()}</p>
                </div>
                <div class="form-group">
                    <label><strong>Net Salary:</strong></label>
                    <p style="font-size: 24px; font-weight: 700; color: var(--success-color);">₹${(payroll.netSalary || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;
}

