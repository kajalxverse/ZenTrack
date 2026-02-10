// ZenTrack - Main Application Logic
// Navigation and State Management

// Global state
window.zenTrackState = {
    currentUser: null,
    inAssessment: false,
    anxietyScore: 0,
    stressData: [20, 45, 35, 60, 30, 50, 40]
};

// Navigation logic
function showSection(id) {
    // Hide all sections
    document.querySelectorAll('.card').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('page-transition');
    });

    // Show selected section with animation
    const section = document.getElementById(id);
    if (section) {
        section.style.display = 'block';
        section.classList.add('page-transition');
    }

    // Update nav active state
    document.querySelectorAll('#mainNav a').forEach(a => a.classList.remove('active'));

    if (id === 'dashboardStage') document.getElementById('navDashboard')?.classList.add('active');
    if (id === 'therapyStage') document.getElementById('navTherapy')?.classList.add('active');
    if (id === 'aboutStage') document.getElementById('navAbout')?.classList.add('active');
    if (id === 'contactStage') document.getElementById('navContact')?.classList.add('active');

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation handler with assessment check
function navHandler(sectionId) {
    return function (e) {
        e.preventDefault();

        // Only block navigation if assessment is truly in progress (not completed)
        if (window.zenTrackState.inAssessment && !window.assessmentCompleted) {
            showNotification("⚠️ Please complete the current assessment before navigating.", "warning");
            return false;
        }

        showSection(sectionId);
    }
}

// Initialize navigation
function initNavigation() {
    const navDashboard = document.getElementById('navDashboard');
    const navTherapy = document.getElementById('navTherapy');
    const navAbout = document.getElementById('navAbout');
    const navContact = document.getElementById('navContact');

    if (navDashboard) navDashboard.onclick = navHandler('dashboardStage');
    if (navTherapy) navTherapy.onclick = navHandler('therapyStage');
    if (navAbout) navAbout.onclick = navHandler('aboutStage');
    if (navContact) navContact.onclick = navHandler('contactStage');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
    max-width: 300px;
  `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Logout function
function logout() {
    // Reset all state
    window.zenTrackState.currentUser = null;
    window.zenTrackState.inAssessment = false;
    window.zenTrackState.anxietyScore = 0;
    window.assessmentCompleted = false;

    // Reset assessment data
    if (window.anxietyAnswers) {
        window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
    }
    window.currentQ = 0;

    // Hide navigation and show login
    document.getElementById('mainNav').style.display = 'none';
    showSection('loginStage');
    document.getElementById('loginStage').style.display = 'block';
    document.querySelectorAll('#mainNav a').forEach(a => a.classList.remove('active'));

    showNotification("👋 Logged out successfully", "success");
}

// Update recent activity
function addRecentActivity(activity) {
    const list = document.getElementById('recentActivityList');
    if (list) {
        const li = document.createElement('li');
        li.textContent = activity;
        li.style.animation = 'fadeInUp 0.5s';
        list.insertBefore(li, list.firstChild);

        // Keep only last 5 activities
        while (list.children.length > 5) {
            list.removeChild(list.lastChild);
        }
    }
}

// Update stress score display
function updateStressScore(score) {
    const scoreElement = document.getElementById('currentStressScore');
    if (scoreElement) {
        scoreElement.textContent = score + '%';
        scoreElement.style.animation = 'pulse 0.5s';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    showSection('loginStage');
});

// Export functions for use in other modules
window.zenTrack = {
    showSection,
    showNotification,
    logout,
    addRecentActivity,
    updateStressScore
};
