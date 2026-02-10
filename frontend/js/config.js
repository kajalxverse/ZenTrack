// ZenTrack - Global Configuration
// Load this FIRST before any other scripts

// API Configuration (use var for global scope)
// API Configuration
// When deploying, change this URL to your production backend URL (e.g., https://zentrack-api.onrender.com/api)
var API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://YOUR_BACKEND_URL.onrender.com/api'; // Replace this after deploying backend

// Global state
window.zenTrackState = window.zenTrackState || {
    currentUser: null,
    anxietyScore: 0,
    isLoggedIn: false
};

// Helper to get auth token
window.getAuthToken = function () {
    return localStorage.getItem('zentrack_token');
};

// Helper to check if logged in
window.isUserLoggedIn = function () {
    return !!window.getAuthToken();
};

console.log('✅ ZenTrack Config Loaded');
