// Authentication UI
let currentView = 'signin';

function showAuthView(view) {
    currentView = view;
    renderAuth();
}

function renderAuth() {
    const app = document.getElementById('app');
    
    if (currentView === 'signin') {
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="logo-placeholder">DF</div>
                        <h1>Dayflow HRMS</h1>
                        <p>Sign in to your account</p>
                    </div>
                    <div id="auth-alert"></div>
                    <form id="signin-form">
                        <div class="form-group">
                            <label>Login ID / Email</label>
                            <input type="text" id="signin-email" placeholder="Enter your email or login ID" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="signin-password" placeholder="Enter your password" required>
                                <button type="button" class="password-toggle" onclick="togglePassword('signin-password')">👁️</button>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">SIGN IN</button>
                    </form>
                    <div class="auth-footer">
                        Don't have an account? <a href="#" onclick="showAuthView('signup'); return false;">Sign Up</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('signin-form').addEventListener('submit', handleSignIn);
    } else {
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <div class="logo-placeholder">DF</div>
                        <h1>Dayflow HRMS</h1>
                        <p>Create your account</p>
                    </div>
                    <div id="auth-alert"></div>
                    <form id="signup-form">
                        <div class="form-group">
                            <label>Company Name</label>
                            <input type="text" id="signup-company" placeholder="Enter company name" required>
                        </div>
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="signup-name" placeholder="First Name" required>
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" id="signup-lastname" placeholder="Last Name" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="signup-email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="signup-phone" placeholder="Enter your phone number">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="signup-password" placeholder="Create a password" required>
                                <button type="button" class="password-toggle" onclick="togglePassword('signup-password')">👁️</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Confirm Password</label>
                            <div class="password-input-wrapper">
                                <input type="password" id="signup-confirm-password" placeholder="Confirm your password" required>
                                <button type="button" class="password-toggle" onclick="togglePassword('signup-confirm-password')">👁️</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="signup-role" required>
                                <option value="">Select Role</option>
                                <option value="HR">HR / Admin</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Sign Up</button>
                    </form>
                    <div class="auth-footer">
                        Already have an account? <a href="#" onclick="showAuthView('signin'); return false;">Sign In</a>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function showAlert(message, type = 'error') {
    const alertDiv = document.getElementById('auth-alert');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    try {
        const response = await authAPI.signin(email, password);
        if (response && response.token) {
            setToken(response.token);
            setCurrentUser(response.user);
            window.location.reload();
        }
    } catch (error) {
        showAlert(error.message || 'Invalid credentials');
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const companyName = document.getElementById('signup-company').value;
    const firstName = document.getElementById('signup-name').value;
    const lastName = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await authAPI.signup({
            email,
            password,
            role,
            companyName,
            firstName,
            lastName,
            phone
        });
        
        if (response && response.token) {
            setToken(response.token);
            setCurrentUser(response.user);
            showAlert('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        showAlert(error.message || 'Sign up failed');
    }
}

// Initialize auth view on load
if (!getToken()) {
    renderAuth();
}

