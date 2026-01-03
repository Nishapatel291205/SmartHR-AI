// API Configuration
const API_BASE_URL = window.location.origin;

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user in localStorage
function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - redirect to login
                removeToken();
                window.location.href = '/';
                return null;
            }
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    signup: async (data) => {
        return await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    signin: async (email, password) => {
        return await apiRequest('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    getMe: async () => {
        return await apiRequest('/auth/me');
    }
};

// Employees API
const employeesAPI = {
    getAll: async () => {
        return await apiRequest('/employees');
    },
    getById: async (id) => {
        return await apiRequest(`/employees/${id}`);
    },
    create: async (data) => {
        return await apiRequest('/employees', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id, data) => {
        return await apiRequest(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    delete: async (id) => {
        return await apiRequest(`/employees/${id}`, {
            method: 'DELETE'
        });
    }
};

// Attendance API
const attendanceAPI = {
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/attendance?${queryString}`);
    },
    create: async (data) => {
        return await apiRequest('/attendance', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    checkIn: async () => {
        return await apiRequest('/attendance/checkin', {
            method: 'POST'
        });
    },
    checkOut: async () => {
        return await apiRequest('/attendance/checkout', {
            method: 'POST'
        });
    },
    getToday: async () => {
        return await apiRequest('/attendance/today');
    },
    getSummary: async (employeeId = null) => {
        const endpoint = employeeId ? `/attendance/summary/${employeeId}` : '/attendance/summary';
        return await apiRequest(endpoint);
    },
    update: async (id, data) => {
        return await apiRequest(`/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};

// Leaves API
const leavesAPI = {
    getAll: async () => {
        return await apiRequest('/leaves');
    },
    getById: async (id) => {
        return await apiRequest(`/leaves/${id}`);
    },
    create: async (data) => {
        return await apiRequest('/leaves', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    approve: async (id, status, comments) => {
        return await apiRequest(`/leaves/${id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ status, reviewComments: comments })
        });
    },
    delete: async (id) => {
        return await apiRequest(`/leaves/${id}`, {
            method: 'DELETE'
        });
    },
    getSummary: async (employeeId = null) => {
        const endpoint = employeeId ? `/leaves/summary/${employeeId}` : '/leaves/summary';
        return await apiRequest(endpoint);
    }
};

// Payroll API
const payrollAPI = {
    getAll: async () => {
        return await apiRequest('/payroll');
    },
    getById: async (id) => {
        return await apiRequest(`/payroll/${id}`);
    },
    getByEmployee: async (employeeId) => {
        return await apiRequest(`/payroll/employee/${employeeId}`);
    },
    create: async (data) => {
        return await apiRequest('/payroll', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id, data) => {
        return await apiRequest(`/payroll/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};

// Reports API
const reportsAPI = {
    getDashboard: async () => {
        return await apiRequest('/reports/dashboard');
    },
    getAttendance: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/reports/attendance?${queryString}`);
    },
    getLeaves: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await apiRequest(`/reports/leaves?${queryString}`);
    },
    getPayroll: async () => {
        return await apiRequest('/reports/payroll');
    }
};

