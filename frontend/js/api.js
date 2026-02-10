/**
 * ZenTrack API Integration Layer
 * Handles all backend API communications
 */

// Use API_BASE_URL from config.js (already defined globally)
// No need to redeclare it here

// ==================== Helper Functions ====================

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('zentrack_token');
}

/**
 * Set authentication token in localStorage
 */
function setAuthToken(token) {
    localStorage.setItem('zentrack_token', token);
}

/**
 * Remove authentication token
 */
function clearAuthToken() {
    localStorage.removeItem('zentrack_token');
    localStorage.removeItem('zentrack_user');
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return !!getAuthToken();
}

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('zentrack_user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Set current user in localStorage
 */
function setCurrentUser(user) {
    localStorage.setItem('zentrack_user', JSON.stringify(user));
}

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // Handle unauthorized
        if (response.status === 401 || response.status === 422) {
            clearAuthToken();
            if (window.location.pathname !== '/login.html') {
                window.location.href = 'login.html';
            }
            return { success: false, message: 'Session expired. Please login again.' };
        }

        return {
            success: response.ok,
            status: response.status,
            data: data,
            message: data.message || data.error || (response.ok ? 'Success' : 'Request failed')
        };
    } catch (error) {
        console.error('API Request Error:', error);
        return {
            success: false,
            message: 'Network error. Please check your connection.',
            error: error.message
        };
    }
}

// ==================== Authentication APIs ====================

/**
 * Login user
 */
async function login(email, password) {
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (result.success && result.data.access_token) {
        setAuthToken(result.data.access_token);
        setCurrentUser(result.data.user);
    }

    return result;
}

/**
 * Register new user
 */
async function register(name, email, password) {
    const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });

    if (result.success && result.data.access_token) {
        setAuthToken(result.data.access_token);
        setCurrentUser(result.data.user);
    }

    return result;
}

/**
 * Get current user info
 */
async function getMe() {
    const result = await apiRequest('/auth/me');

    if (result.success && result.data.user) {
        setCurrentUser(result.data.user);
    }

    return result;
}

/**
 * Logout user
 */
function logout() {
    clearAuthToken();
    window.location.href = 'login.html';
}

// ==================== Chat APIs ====================

/**
 * Send message to AI chatbot
 */
async function sendChatMessage(message) {
    return await apiRequest('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
}

/**
 * Get chat history
 */
async function getChatHistory(limit = 50) {
    return await apiRequest(`/chat/history?limit=${limit}`);
}

/**
 * Clear chat history
 */
async function clearChatHistory() {
    return await apiRequest('/chat/clear', {
        method: 'DELETE'
    });
}

/**
 * Get stress management tip
 */
async function getStressTip() {
    return await apiRequest('/chat/tip');
}

// ==================== Stress Assessment APIs ====================

/**
 * Submit stress assessment
 */
async function submitStressAssessment(answers, rrIntervals = null) {
    const payload = { answers };
    if (rrIntervals) {
        payload.rr_intervals = rrIntervals;
    }

    return await apiRequest('/stress/assess', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

/**
 * Get stress sessions history
 */
async function getStressSessions(limit = 50) {
    return await apiRequest(`/stress/sessions?limit=${limit}`);
}

/**
 * Get specific stress session
 */
async function getStressSession(sessionId) {
    return await apiRequest(`/stress/sessions/${sessionId}`);
}

/**
 * Get stress analytics
 */
async function getStressAnalytics(days = 30) {
    return await apiRequest(`/stress/analytics?days=${days}`);
}

/**
 * Save assessment (legacy endpoint)
 */
async function saveAssessment(score) {
    return await apiRequest('/user/assessment', {
        method: 'POST',
        body: JSON.stringify({ score })
    });
}

// ==================== Therapy APIs ====================

/**
 * Get all therapies
 */
async function getTherapies(category = null) {
    const url = category ? `/therapies?category=${category}` : '/therapies';
    return await apiRequest(url);
}

/**
 * Get specific therapy
 */
async function getTherapy(therapyId) {
    return await apiRequest(`/therapies/${therapyId}`);
}

// ==================== Music Therapy APIs ====================

/**
 * Get all music therapy
 */
async function getMusicTherapy(category = null) {
    const url = category ? `/music?category=${category}` : '/music';
    return await apiRequest(url);
}

/**
 * Track music play
 */
async function playMusic(musicId) {
    return await apiRequest(`/music/${musicId}/play`, {
        method: 'POST'
    });
}

// ==================== Admin APIs ====================

/**
 * Get all users (Admin only)
 */
async function getAllUsers() {
    return await apiRequest('/admin/users');
}

/**
 * Get admin statistics (Admin only)
 */
async function getAdminStats() {
    return await apiRequest('/admin/stats');
}

/**
 * Delete user (Admin only)
 */
async function deleteUser(userId) {
    return await apiRequest(`/admin/users/${userId}`, {
        method: 'DELETE'
    });
}

// ==================== Health Check ====================

/**
 * Check API health
 */
async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
        return await response.json();
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

// ==================== Route Protection ====================

/**
 * Protect route - redirect to login if not authenticated
 */
function protectRoute() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Initialize protected page
 */
async function initProtectedPage() {
    if (!protectRoute()) {
        return null;
    }

    // Verify token is still valid
    const result = await getMe();
    if (!result.success) {
        logout();
        return null;
    }

    return result.data.user;
}

// ==================== Export for use in other scripts ====================

// Make ALL functions available globally on window object
window.getAuthToken = getAuthToken;
window.setAuthToken = setAuthToken;
window.clearAuthToken = clearAuthToken;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.apiRequest = apiRequest;

// Auth functions
window.login = login;
window.register = register;
window.logout = logout;
window.getMe = getMe;

// Chat functions
window.sendChatMessage = sendChatMessage;
window.getChatHistory = getChatHistory;
window.clearChatHistory = clearChatHistory;
window.getStressTip = getStressTip;

// Stress functions
window.submitStressAssessment = submitStressAssessment;
window.getStressSessions = getStressSessions;
window.getStressSession = getStressSession;
window.getStressAnalytics = getStressAnalytics;
window.saveAssessment = saveAssessment;

// Therapy functions
window.getTherapies = getTherapies;
window.getTherapy = getTherapy;
window.getMusicTherapy = getMusicTherapy;
window.playMusic = playMusic;

// Admin functions
window.getAllUsers = getAllUsers;
window.getAdminStats = getAdminStats;
window.deleteUser = deleteUser;

// Utils
window.healthCheck = healthCheck;
window.protectRoute = protectRoute;
window.initProtectedPage = initProtectedPage;

// Also keep the ZenTrackAPI object for organized access
window.ZenTrackAPI = {
    // Auth
    login,
    register,
    logout,
    getMe,
    isLoggedIn,
    getCurrentUser,

    // Chat
    sendChatMessage,
    getChatHistory,
    clearChatHistory,
    getStressTip,

    // Stress
    submitStressAssessment,
    getStressSessions,
    getStressSession,
    getStressAnalytics,
    saveAssessment,

    // Therapy
    getTherapies,
    getTherapy,
    getMusicTherapy,
    playMusic,

    // Admin
    getAllUsers,
    getAdminStats,
    deleteUser,

    // Utils
    healthCheck,
    protectRoute,
    initProtectedPage
};

console.log('✅ ZenTrack API Module Loaded - All functions available globally');
console.log('📌 Available functions:', Object.keys(window.ZenTrackAPI));
