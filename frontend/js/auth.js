// ZenTrack - Authentication Module (Fixed & Working)
// Complete backend integration with proper error handling

// Use global API_BASE_URL from config.js (don't redeclare)
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'http://localhost:5000/api';
}
let authToken = localStorage.getItem('zentrack_token') || null;

// API Helper
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || result.message || 'Request failed');
    }

    return result;
}

// Register Function
async function simulateRegister() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const authResult = document.getElementById('authResult');

    if (!email || !password) {
        authResult.textContent = '❌ Please enter email and password';
        authResult.style.color = '#ef4444';
        return;
    }

    if (password.length < 6) {
        authResult.textContent = '❌ Password must be at least 6 characters';
        authResult.style.color = '#ef4444';
        return;
    }

    authResult.textContent = '⏳ Creating account...';
    authResult.style.color = '#f59e0b';

    try {
        const result = await apiCall('/auth/register', 'POST', {
            email: email,
            password: password,
            name: email.split('@')[0]
        });

        authToken = result.access_token;
        localStorage.setItem('zentrack_token', authToken);
        localStorage.setItem('zentrack_user', JSON.stringify(result.user));

        authResult.textContent = `✅ Account created! Welcome ${result.user.email}`;
        authResult.style.color = '#10b981';

        setTimeout(() => {
            document.getElementById('loginStage').style.display = 'none';
            document.getElementById('mainNav').style.display = 'none';

            window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
            window.currentQ = 0;
            window.assessmentCompleted = false;

            if (typeof renderAnxietyQuestion === 'function') {
                renderAnxietyQuestion();
            }

            showSection('anxietyAssessment');
        }, 1500);

    } catch (error) {
        authResult.textContent = `❌ ${error.message}`;
        authResult.style.color = '#ef4444';
    }
}

// Login Function
async function simulateLogin() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const authResult = document.getElementById('authResult');

    if (!email || !password) {
        authResult.textContent = '❌ Please enter email and password';
        authResult.style.color = '#ef4444';
        return;
    }

    authResult.textContent = '⏳ Logging in...';
    authResult.style.color = '#f59e0b';

    try {
        const result = await apiCall('/auth/login', 'POST', {
            email: email,
            password: password
        });

        authToken = result.access_token;
        localStorage.setItem('zentrack_token', authToken);
        localStorage.setItem('zentrack_user', JSON.stringify(result.user));

        window.zenTrackState.currentUser = result.user.email;

        authResult.textContent = `✅ Welcome back ${result.user.email}!`;
        authResult.style.color = '#10b981';

        if (result.user.has_completed_assessment) {
            if (result.user.last_anxiety_score && window.zenTrack) {
                window.zenTrackState.anxietyScore = result.user.last_anxiety_score;
                window.zenTrack.updateStressScore(result.user.last_anxiety_score);
            }

            setTimeout(() => {
                document.getElementById('loginStage').style.display = 'none';
                document.getElementById('mainNav').style.display = 'flex';
                showSection('dashboardStage');
            }, 1000);
        } else {
            setTimeout(() => {
                document.getElementById('loginStage').style.display = 'none';
                document.getElementById('mainNav').style.display = 'none';

                window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
                window.currentQ = 0;
                window.assessmentCompleted = false;

                if (typeof renderAnxietyQuestion === 'function') {
                    renderAnxietyQuestion();
                }

                showSection('anxietyAssessment');
            }, 1000);
        }

    } catch (error) {
        authResult.textContent = `❌ ${error.message}`;
        authResult.style.color = '#ef4444';
    }
}

// Logout
function logout() {
    authToken = null;
    localStorage.removeItem('zentrack_token');
    localStorage.removeItem('zentrack_user');
    window.zenTrackState.currentUser = null;

    document.getElementById('mainNav').style.display = 'none';
    document.getElementById('loginStage').style.display = 'block';

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';

    if (window.zenTrack && window.zenTrack.showNotification) {
        window.zenTrack.showNotification('👋 Logged out', 'info');
    }
}

// Save Assessment
async function saveUserAssessmentData(email, score) {
    if (!authToken) {
        console.log('No auth token, skipping backend save');
        return;
    }

    try {
        await apiCall('/user/assessment', 'POST', { score: score });
        console.log('Assessment saved to backend');
    } catch (error) {
        console.error('Failed to save assessment:', error);
    }
}

// Get User Data (local fallback)
function getUserData(email) {
    const userKey = `zentrack_user_${email}`;
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : null;
}

// Skip to Dashboard (demo mode)
function skipToDashboard() {
    const authResult = document.getElementById('authResult');
    authResult.textContent = '⚡ Skipping to dashboard...';
    authResult.style.color = '#f59e0b';

    window.zenTrackState.currentUser = 'demo@zentrack.com';

    setTimeout(() => {
        document.getElementById('loginStage').style.display = 'none';
        document.getElementById('mainNav').style.display = 'flex';
        showSection('dashboardStage');
    }, 800);
}

// Auto-login check
async function checkAuthStatus() {
    if (!authToken) return;

    try {
        const result = await apiCall('/auth/me');
        localStorage.setItem('zentrack_user', JSON.stringify(result.user));
        window.zenTrackState.currentUser = result.user.email;

        if (result.user.has_completed_assessment) {
            document.getElementById('loginStage').style.display = 'none';
            document.getElementById('mainNav').style.display = 'flex';
            showSection('dashboardStage');

            if (result.user.last_anxiety_score && window.zenTrack) {
                window.zenTrackState.anxietyScore = result.user.last_anxiety_score;
                window.zenTrack.updateStressScore(result.user.last_anxiety_score);
            }
        }
    } catch (error) {
        authToken = null;
        localStorage.removeItem('zentrack_token');
        localStorage.removeItem('zentrack_user');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Enter key support
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                simulateLogin();
            }
        });
    }

    // Demo credentials auto-fill
    const demoBox = document.getElementById('demoBox');
    if (demoBox) {
        demoBox.onclick = function () {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            if (usernameInput && passwordInput) {
                usernameInput.value = 'demo@zentrack.com';
                passwordInput.value = 'demo123';

                if (window.zenTrack && window.zenTrack.showNotification) {
                    window.zenTrack.showNotification('✅ Demo credentials filled!', 'info');
                }
            }
        };
    }

    // Check if already logged in (disabled to prevent 422 errors on first load)
    // Uncomment below line if you want auto-login on page refresh
    // setTimeout(checkAuthStatus, 500);
});

// Export to window
window.simulateLogin = simulateLogin;
window.simulateRegister = simulateRegister;
window.logout = logout;
window.skipToDashboard = skipToDashboard;
window.saveUserAssessmentData = saveUserAssessmentData;
window.getUserData = getUserData;
window.apiCall = apiCall;
