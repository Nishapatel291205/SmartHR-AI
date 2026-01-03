// Main Application Router
let currentPage = 'dashboard';
let currentUser = null;

// Initialize app
async function initApp() {
    const token = getToken();
    if (!token) {
        return; // Auth.js will handle login
    }
    
    try {
        const response = await authAPI.getMe();
        if (response && response.user) {
            currentUser = response.user;
            setCurrentUser(response.user);
            renderApp();
        } else {
            removeToken();
            window.location.reload();
        }
    } catch (error) {
        removeToken();
        window.location.reload();
    }
}

function renderApp() {
    const app = document.getElementById('app');
    
    if (currentUser.role === 'HR') {
        renderHRApp();
    } else {
        renderEmployeeApp();
    }
}

function renderHRApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="dashboard">
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">DF</div>
                    <h3>Dayflow HRMS</h3>
                </div>
                <ul class="sidebar-nav">
                    <li><a href="#" onclick="navigate('dashboard'); return false;" class="${currentPage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
                    <li><a href="#" onclick="navigate('employees'); return false;" class="${currentPage === 'employees' ? 'active' : ''}">👥 Employees</a></li>
                    <li><a href="#" onclick="navigate('attendance'); return false;" class="${currentPage === 'attendance' ? 'active' : ''}">⏰ Attendance</a></li>
                    <li><a href="#" onclick="navigate('leaves'); return false;" class="${currentPage === 'leaves' ? 'active' : ''}">🏖️ Leave Requests</a></li>
                    <li><a href="#" onclick="navigate('payroll'); return false;" class="${currentPage === 'payroll' ? 'active' : ''}">💰 Payroll</a></li>
                    <li><a href="#" onclick="navigate('reports'); return false;" class="${currentPage === 'reports' ? 'active' : ''}">📈 Reports</a></li>
                    <li><a href="#" onclick="logout(); return false;">🚪 Logout</a></li>
                </ul>
            </div>
            <div class="main-content">
                <div class="header">
                    <h1 id="page-title">Dashboard</h1>
                    <div class="header-actions">
                        <div class="user-profile">
                            <div class="user-avatar" onclick="toggleProfileDropdown()">
                                ${getUserInitials()}
                            </div>
                            <div class="profile-dropdown" id="profile-dropdown">
                                <a href="#" onclick="navigate('profile'); return false;">My Profile</a>
                                <a href="#" onclick="logout(); return false;">Log Out</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="page-content"></div>
            </div>
        </div>
    `;
    
    loadHRPage();
}

function renderEmployeeApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="dashboard">
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">DF</div>
                    <h3>Dayflow HRMS</h3>
                </div>
                <ul class="sidebar-nav">
                    <li><a href="#" onclick="navigate('dashboard'); return false;" class="${currentPage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
                    <li><a href="#" onclick="navigate('profile'); return false;" class="${currentPage === 'profile' ? 'active' : ''}">👤 My Profile</a></li>
                    <li><a href="#" onclick="navigate('attendance'); return false;" class="${currentPage === 'attendance' ? 'active' : ''}">⏰ Attendance</a></li>
                    <li><a href="#" onclick="navigate('leaves'); return false;" class="${currentPage === 'leaves' ? 'active' : ''}">🏖️ My Leaves</a></li>
                    <li><a href="#" onclick="navigate('payroll'); return false;" class="${currentPage === 'payroll' ? 'active' : ''}">💰 Payroll</a></li>
                    <li><a href="#" onclick="logout(); return false;">🚪 Logout</a></li>
                </ul>
            </div>
            <div class="main-content">
                <div class="header">
                    <h1 id="page-title">Dashboard</h1>
                    <div class="header-actions">
                        <div class="user-profile">
                            <div class="user-avatar" onclick="toggleProfileDropdown()">
                                ${getUserInitials()}
                            </div>
                            <div class="profile-dropdown" id="profile-dropdown">
                                <a href="#" onclick="navigate('profile'); return false;">My Profile</a>
                                <a href="#" onclick="logout(); return false;">Log Out</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="page-content"></div>
            </div>
        </div>
    `;
    
    loadEmployeePage();
}

function navigate(page) {
    currentPage = page;
    renderApp();
}

function loadHRPage() {
    const content = document.getElementById('page-content');
    const title = document.getElementById('page-title');
    
    switch(currentPage) {
        case 'dashboard':
            title.textContent = 'Dashboard';
            if (typeof loadHRDashboard === 'function') {
                loadHRDashboard();
            }
            break;
        case 'employees':
            title.textContent = 'Employees';
            if (typeof loadHREmployees === 'function') {
                loadHREmployees();
            }
            break;
        case 'attendance':
            title.textContent = 'Attendance';
            if (typeof loadHRAttendance === 'function') {
                loadHRAttendance();
            }
            break;
        case 'leaves':
            title.textContent = 'Leave Requests';
            if (typeof loadHRLeaves === 'function') {
                loadHRLeaves();
            }
            break;
        case 'payroll':
            title.textContent = 'Payroll';
            if (typeof loadHRPayroll === 'function') {
                loadHRPayroll();
            }
            break;
        case 'reports':
            title.textContent = 'Reports';
            if (typeof loadHRReports === 'function') {
                loadHRReports();
            }
            break;
        case 'profile':
            title.textContent = 'My Profile';
            if (typeof loadProfile === 'function') {
                loadProfile();
            }
            break;
        default:
            if (typeof loadHRDashboard === 'function') {
                loadHRDashboard();
            }
    }
}

function loadEmployeePage() {
    const content = document.getElementById('page-content');
    const title = document.getElementById('page-title');
    
    switch(currentPage) {
        case 'dashboard':
            title.textContent = 'Dashboard';
            if (typeof loadEmployeeDashboard === 'function') {
                loadEmployeeDashboard();
            }
            break;
        case 'profile':
            title.textContent = 'My Profile';
            if (typeof loadProfile === 'function') {
                loadProfile();
            }
            break;
        case 'attendance':
            title.textContent = 'Attendance';
            if (typeof loadEmployeeAttendance === 'function') {
                loadEmployeeAttendance();
            }
            break;
        case 'leaves':
            title.textContent = 'My Leaves';
            if (typeof loadEmployeeLeaves === 'function') {
                loadEmployeeLeaves();
            }
            break;
        case 'payroll':
            title.textContent = 'Payroll';
            if (typeof loadEmployeePayroll === 'function') {
                loadEmployeePayroll();
            }
            break;
        default:
            if (typeof loadEmployeeDashboard === 'function') {
                loadEmployeeDashboard();
            }
    }
}

function getUserInitials() {
    if (currentUser && currentUser.employee) {
        const firstName = currentUser.employee.firstName || '';
        const lastName = currentUser.employee.lastName || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    return currentUser?.email?.charAt(0).toUpperCase() || 'U';
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profile-dropdown');
    const avatar = document.querySelector('.user-avatar');
    if (dropdown && avatar && !avatar.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        removeToken();
        window.location.reload();
    }
}

// Global utility function for closing modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Load HR Dashboard
async function loadHRDashboard() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="spinner"></div>';
    
    try {
        const data = await reportsAPI.getDashboard();
        
        content.innerHTML = `
            <div class="card-grid">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Total Employees</span>
                        <div class="card-icon primary">👥</div>
                    </div>
                    <div class="card-value">${data.totalEmployees || 0}</div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Present Today</span>
                        <div class="card-icon success">✓</div>
                    </div>
                    <div class="card-value">${data.employeesPresentToday || 0}</div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Pending Leaves</span>
                        <div class="card-icon warning">⏳</div>
                    </div>
                    <div class="card-value">${data.pendingLeaves || 0}</div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">Monthly Payroll</span>
                        <div class="card-icon primary">₹</div>
                    </div>
                    <div class="card-value">₹${(data.totalMonthlyPayroll || 0).toLocaleString()}</div>
                </div>
            </div>
            <div class="table-container">
                <div class="table-header">
                    <h2>Recent Activity</h2>
                </div>
                <p style="text-align: center; color: var(--text-secondary); padding: 40px;">
                    Welcome to Dayflow HRMS! Use the navigation menu to manage employees, attendance, leaves, and payroll.
                </p>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="alert alert-error">Error loading dashboard: ${error.message}</div>`;
    }
}

// Initialize on page load
if (getToken()) {
    initApp();
}

