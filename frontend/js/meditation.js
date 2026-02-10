// ZenTrack - Meditation Timer Module
// Guided meditation and breathing exercises

let meditationTimer = null;
let meditationSeconds = 0;
let meditationRunning = false;

function startMeditation(duration = 300) { // Default 5 minutes
    if (meditationRunning) {
        stopMeditation();
        return;
    }

    meditationSeconds = duration;
    meditationRunning = true;

    const btn = document.getElementById('meditationStartBtn');
    if (btn) {
        btn.textContent = '⏸️ Pause';
        btn.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }

    updateMeditationDisplay();

    meditationTimer = setInterval(() => {
        meditationSeconds--;
        updateMeditationDisplay();

        if (meditationSeconds <= 0) {
            completeMeditation();
        }
    }, 1000);

    window.zenTrack?.showNotification('🧘 Meditation session started!', 'success');
    window.zenTrack?.addRecentActivity('Started meditation session');
}

function stopMeditation() {
    if (meditationTimer) {
        clearInterval(meditationTimer);
        meditationTimer = null;
    }

    meditationRunning = false;

    const btn = document.getElementById('meditationStartBtn');
    if (btn) {
        btn.textContent = '▶️ Start';
        btn.style.background = '';
    }

    window.zenTrack?.showNotification('Meditation paused', 'info');
}

function resetMeditation() {
    stopMeditation();
    meditationSeconds = 300;
    updateMeditationDisplay();
}

function completeMeditation() {
    stopMeditation();

    const display = document.getElementById('meditationDisplay');
    if (display) {
        display.innerHTML = `
            <div style="text-align: center; animation: scaleIn 0.6s;">
                <div style="font-size: 4rem; margin-bottom: 10px;">✨</div>
                <div style="font-size: 1.5rem; color: var(--primary); font-weight: 700;">
                    Session Complete!
                </div>
                <div style="color: var(--muted); margin-top: 10px;">
                    Great job! You've completed your meditation.
                </div>
            </div>
        `;
    }

    window.zenTrack?.showNotification('🎉 Meditation session completed!', 'success');
    window.zenTrack?.addRecentActivity('Completed meditation session');

    // Reset after 3 seconds
    setTimeout(() => {
        meditationSeconds = 300;
        updateMeditationDisplay();
    }, 3000);
}

function updateMeditationDisplay() {
    const display = document.getElementById('meditationDisplay');
    if (!display) return;

    const minutes = Math.floor(meditationSeconds / 60);
    const seconds = meditationSeconds % 60;
    const progress = ((300 - meditationSeconds) / 300) * 100;

    display.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 4rem; font-weight: 700; color: var(--primary); margin-bottom: 10px; font-family: 'Courier New', monospace;">
                ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
            </div>
            <div style="width: 100%; height: 8px; background: var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 15px;">
                <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); transition: width 1s linear;"></div>
            </div>
            <div style="color: var(--muted); font-size: 0.95rem;">
                ${meditationRunning ? '🧘 Focus on your breath...' : 'Ready to begin?'}
            </div>
        </div>
    `;
}

function setMeditationDuration(minutes) {
    if (!meditationRunning) {
        meditationSeconds = minutes * 60;
        updateMeditationDisplay();
        window.zenTrack?.showNotification(`Duration set to ${minutes} minutes`, 'info');
    }
}

// Breathing exercise guide
function startBreathingExercise() {
    const phases = [
        { text: '😌 Breathe In...', duration: 4000, color: '#6366f1' },
        { text: '🫁 Hold...', duration: 4000, color: '#06b6d4' },
        { text: '😮‍💨 Breathe Out...', duration: 4000, color: '#10b981' },
        { text: '⏸️ Hold...', duration: 4000, color: '#f59e0b' }
    ];

    let currentPhase = 0;
    const breathingDisplay = document.getElementById('breathingDisplay');

    if (!breathingDisplay) return;

    function showPhase() {
        const phase = phases[currentPhase];
        breathingDisplay.innerHTML = `
            <div style="text-align: center; animation: scaleIn 0.5s;">
                <div style="font-size: 3rem; margin-bottom: 15px;">${phase.text.split(' ')[0]}</div>
                <div style="font-size: 1.8rem; font-weight: 700; color: ${phase.color};">
                    ${phase.text.split(' ').slice(1).join(' ')}
                </div>
            </div>
        `;

        currentPhase = (currentPhase + 1) % phases.length;
    }

    showPhase();
    const breathingInterval = setInterval(showPhase, 4000);

    // Stop after 2 minutes (10 cycles)
    setTimeout(() => {
        clearInterval(breathingInterval);
        breathingDisplay.innerHTML = `
            <div style="text-align: center; animation: fadeInUp 0.6s;">
                <div style="font-size: 3rem; margin-bottom: 10px;">✨</div>
                <div style="font-size: 1.3rem; color: var(--primary); font-weight: 700;">
                    Breathing Exercise Complete!
                </div>
            </div>
        `;
        window.zenTrack?.showNotification('Breathing exercise completed!', 'success');
        window.zenTrack?.addRecentActivity('Completed breathing exercise');
    }, 120000);

    window.zenTrack?.showNotification('Breathing exercise started', 'success');
    window.zenTrack?.addRecentActivity('Started breathing exercise');
}

// Initialize meditation features
document.addEventListener('DOMContentLoaded', function () {
    updateMeditationDisplay();
});

// Export functions
window.startMeditation = startMeditation;
window.stopMeditation = stopMeditation;
window.resetMeditation = resetMeditation;
window.setMeditationDuration = setMeditationDuration;
window.startBreathingExercise = startBreathingExercise;
