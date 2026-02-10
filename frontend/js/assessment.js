// ZenTrack - Anxiety Assessment Module (FIXED)
// Sequential anxiety assessment with proper state management

// Anxiety assessment questions
window.anxietyQuestions = [
    "Do you often feel worried or afraid something bad will happen?",
    "Do you feel nervous, tense, or find it hard to relax?",
    "Do you have fears, like being alone, in the dark, in traffic, or around strangers or crowds?",
    "Do you have trouble sleeping (falling asleep, staying asleep, or bad dreams)?",
    "Do you find it hard to focus or remember things?",
    "Do you often feel sad, lose interest in things you enjoy, or feel hopeless?",
    "Do you get body pains, tight muscles, twitching, or grind your teeth?",
    "Do you get strange feelings like blurred vision, ringing in your ears, hot/cold flashes, weakness, or tingling?",
    "Do you notice your heart beating fast, pounding, skipping beats, or feel chest pain?",
    "Do you have trouble breathing, feel short of breath, or feel like choking?",
    "Do you have stomach problems (like nausea, stomach pain, constipation, diarrhea, or loss of appetite)?",
    "Do you notice changes in bathroom habits or sex life (like frequent urination, low interest in sex, or changes with periods)?",
    "Do you get physical stress symptoms like dry mouth, sweating, dizziness, headache, or feeling hot/cold suddenly?",
    "Do you fidget, shake, pace, sigh a lot, or look tense when you are anxious?",
    "Overall, how strong has your anxiety been this past week?"
];

window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
window.currentQ = 0;
window.assessmentCompleted = false;

const answerLabels = ["Never", "Rarely", "Sometimes", "Often", "Always"];

function renderAnxietyQuestion() {
    // Only set inAssessment to true if not completed
    if (!window.assessmentCompleted) {
        window.zenTrackState.inAssessment = true;
    }

    const box = document.getElementById('anxietyQuestionBox');

    if (!box) return;

    const progress = ((window.currentQ + 1) / window.anxietyQuestions.length) * 100;

    box.innerHTML = `
    <div style="margin-bottom: 1.5em;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;">
        <label style="font-weight: 600; font-size: 1.15rem; color: var(--primary);">
          Q${window.currentQ + 1}. ${window.anxietyQuestions[window.currentQ]}
        </label>
      </div>
      
      <!-- Progress Bar -->
      <div style="width: 100%; height: 6px; background: var(--border); border-radius: 10px; margin-bottom: 1.5em; overflow: hidden;">
        <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>
      
      <div class="option-select-row">
        ${[0, 1, 2, 3, 4].map(val => `
          <div class="option-select-btn${window.anxietyAnswers[window.currentQ] === val ? ' selected' : ''}" 
            data-value="${val}" 
            tabindex="0"
            role="button"
            aria-label="${answerLabels[val]}">
            <div style="font-size: 1.1em; font-weight: 700;">${answerLabels[val]}</div>
            <div style="font-size: 0.9em; color: var(--muted); margin-top: 4px;">[${val}]</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="color: var(--muted); font-size: 1rem; text-align: center; margin-top: 1em;">
      Question ${window.currentQ + 1} of ${window.anxietyQuestions.length} • ${Math.round(progress)}% Complete
    </div>
  `;

    // Show/hide previous button
    const prevBtn = document.getElementById('prevQ');
    if (prevBtn) {
        prevBtn.style.display = window.currentQ > 0 ? 'inline-block' : 'none';
    }

    const showResultBtn = document.getElementById('showResultBtn');
    if (showResultBtn) {
        showResultBtn.style.display = 'none';
    }

    // Add click event for direct select with enhanced feedback
    document.querySelectorAll('.option-select-btn').forEach(btn => {
        btn.onclick = function () {
            // Visual feedback
            document.querySelectorAll('.option-select-btn').forEach(b => {
                b.classList.remove('selected');
                b.style.transform = '';
            });
            this.classList.add('selected');

            // Store answer
            window.anxietyAnswers[window.currentQ] = parseInt(this.getAttribute('data-value'), 10);

            // Haptic-like feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);

            // Auto move to next question or show result button
            if (window.currentQ < window.anxietyQuestions.length - 1) {
                window.currentQ++;
                setTimeout(renderAnxietyQuestion, 300);
            } else {
                // Show result button at the end
                if (showResultBtn) {
                    showResultBtn.style.display = 'block';
                    showResultBtn.style.animation = 'scaleIn 0.5s';
                }
            }
        };

        // Keyboard support
        btn.onkeydown = function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        };
    });
}

// Previous question handler
document.addEventListener('DOMContentLoaded', function () {
    const prevBtn = document.getElementById('prevQ');
    if (prevBtn) {
        prevBtn.onclick = function () {
            if (window.currentQ > 0) {
                window.currentQ--;
                renderAnxietyQuestion();
            }
        };
    }

    // Show result button logic
    const showResultBtn = document.getElementById('showResultBtn');
    if (showResultBtn) {
        showResultBtn.onclick = function () {
            calculateAndShowResults();
        };
    }
});

function calculateAndShowResults() {
    let total = window.anxietyAnswers.reduce((a, b) => a + (b || 0), 0);
    let result = "";
    let severity = "";

    if (total <= 10) {
        result = "Minimal anxiety. Keep up your healthy habits!";
        severity = "low";
    } else if (total <= 20) {
        result = "Mild anxiety. Try relaxation and self-care.";
        severity = "mild";
    } else if (total <= 35) {
        result = "Moderate anxiety. Consider talking to someone or using therapy tools.";
        severity = "moderate";
    } else {
        result = "Severe anxiety. Please consider reaching out to a mental health professional.";
        severity = "high";
    }

    const anxietyForm = document.getElementById('anxietyForm');
    if (anxietyForm) {
        anxietyForm.style.display = 'none';
    }

    window.latestAnxietyResult = `Your score: ${total} – ${result}`;

    let lastAnxietyScore = Math.round((total / (window.anxietyQuestions.length * 4)) * 100);

    // Update stress chart
    if (window.stressChart) {
        window.stressChart.data.datasets[0].data[6] = lastAnxietyScore;
        window.stressChart.update('active');
    }

    // Update dashboard chart
    if (window.stressChartDashboard) {
        window.stressChartDashboard.data.datasets[0].data[6] = lastAnxietyScore;
        window.stressChartDashboard.update('active');
    }

    // Update stress score
    if (window.zenTrack && window.zenTrack.updateStressScore) {
        window.zenTrack.updateStressScore(lastAnxietyScore);
    }

    // Add to recent activity
    if (window.zenTrack && window.zenTrack.addRecentActivity) {
        window.zenTrack.addRecentActivity(`Completed anxiety assessment - Score: ${total}`);
    }

    // IMPORTANT: Mark assessment as completed and allow navigation
    window.zenTrackState.inAssessment = false;
    window.zenTrackState.anxietyScore = lastAnxietyScore;
    window.assessmentCompleted = true;

    // Save user assessment data
    if (window.zenTrackState.currentUser && window.saveUserAssessmentData) {
        window.saveUserAssessmentData(window.zenTrackState.currentUser, lastAnxietyScore);
    }

    // Show notification
    if (window.zenTrack && window.zenTrack.showNotification) {
        window.zenTrack.showNotification('✅ Assessment completed! You can now navigate freely.', 'success');
    }

    setTimeout(() => {
        // Show result in stress chart section and enable nav
        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            mainNav.style.display = 'flex';
        }

        showSection('dashboardStage');

        const stressResult = document.getElementById('stressResult');
        if (stressResult) {
            stressResult.innerHTML = `
        <div style="background: ${severity === 'low' ? '#10b981' : severity === 'mild' ? '#f59e0b' : severity === 'moderate' ? '#f97316' : '#ef4444'}; 
                    color: white; 
                    padding: 20px; 
                    border-radius: 12px; 
                    text-align: center;
                    animation: scaleIn 0.6s;">
          <h3 style="margin: 0 0 10px 0; font-size: 1.5rem;">✅ Assessment Complete</h3>
          <p style="margin: 0; font-size: 1.2rem; font-weight: 600;">${window.latestAnxietyResult}</p>
          <p style="margin: 10px 0 0 0; font-size: 0.95rem; opacity: 0.9;">You can now access all features!</p>
        </div>
      `;
        }

        // Reset assessment for next time (but keep it as completed)
        if (anxietyForm) {
            anxietyForm.style.display = '';
        }

        const showResultBtn = document.getElementById('showResultBtn');
        if (showResultBtn) {
            showResultBtn.style.display = 'none';
        }

        window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
        window.currentQ = 0;

        // DON'T call renderAnxietyQuestion here - it causes the bug!
        // Only render when user explicitly starts a new assessment
    }, 800);
}

// Function to generate new questions using AI
// SECURITY NOTE: This function has been disabled to prevent API key exposure
// The backend uses Groq API for all AI features (chatbot, recommendations)
// For security reasons, we use predefined questions instead of client-side AI generation
async function generateNewQuestions() {
    console.warn('⚠️ AI question generation disabled for security reasons');
    console.info('ℹ️ Using predefined assessment questions. Backend handles all AI features via Groq API.');

    // Return null to use default questions
    // If you need AI-generated questions, create a backend endpoint instead:
    // POST /api/assessment/generate-questions (protected with JWT)
    return null;
}

// Function to start a new assessment (called from dashboard)
async function startNewAssessment() {
    window.assessmentCompleted = false;
    window.zenTrackState.inAssessment = true;

    // Use standard assessment questions (secure and reliable)
    window.anxietyQuestions = [
        "Do you often feel worried or afraid something bad will happen?",
        "Do you feel nervous, tense, or find it hard to relax?",
        "Do you have fears, like being alone, in the dark, in traffic, or around strangers or crowds?",
        "Do you have trouble sleeping (falling asleep, staying asleep, or bad dreams)?",
        "Do you find it hard to focus or remember things?",
        "Do you often feel sad, lose interest in things you enjoy, or feel hopeless?",
        "Do you get body pains, tight muscles, twitching, or grind your teeth?",
        "Do you get strange feelings like blurred vision, ringing in your ears, hot/cold flashes, weakness, or tingling?",
        "Do you notice your heart beating fast, pounding, skipping beats, or feel chest pain?",
        "Do you have trouble breathing, feel short of breath, or feel like choking?",
        "Do you have stomach problems (like nausea, stomach pain, constipation, diarrhea, or loss of appetite)?",
        "Do you notice changes in bathroom habits or sex life (like frequent urination, low interest in sex, or changes with periods)?",
        "Do you get physical stress symptoms like dry mouth, sweating, dizziness, headache, or feeling hot/cold suddenly?",
        "Do you fidget, shake, pace, sigh a lot, or look tense when you are anxious?",
        "Overall, how strong has your anxiety been this past week?"
    ];

    // Reset answers
    window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
    window.currentQ = 0;

    const anxietyForm = document.getElementById('anxietyForm');
    if (anxietyForm) {
        anxietyForm.style.display = '';
    }

    // Show notification
    window.zenTrack?.showNotification('📋 Starting anxiety assessment...', 'info');

    renderAnxietyQuestion();
    showSection('anxietyAssessment');
}

// Export for global use
window.startNewAssessment = startNewAssessment;
window.generateNewQuestions = generateNewQuestions;
