// ZenTrack - Anxiety Assessment Module (Hamilton Anxiety Rating Scale - HAM-A)
// Standard 14-item clinical scale for evaluating anxiety severity

// Anxiety assessment questions based on HAM-A
window.anxietyQuestions = [
    "Anxious Mood: Do you feel worried, irritable, or fear the worst will happen?",
    "Tension: Do you feel tense, restless, startle easily, or find it hard to relax?",
    "Fears: Do you have fears of the dark, strangers, crowds, or being alone?",
    "Insomnia: Do you have trouble falling asleep, staying asleep, or have nightmares?",
    "Intellectual: Do you find it hard to concentrate or have a poor memory?",
    "Depressed Mood: Have you lost interest in hobbies or feel sad/hopeless?",
    "Somatic (Muscular): Do you feel muscle pains, stiffness, or grind your teeth?",
    "Somatic (Sensory): Do you have ringing in ears, blurred vision, or hot/cold flashes?",
    "Cardiovascular: Do you notice a fast heart rate, palpitations, or chest pain?",
    "Respiratory: Do you feel pressure in your chest, sighing, or shortness of breath?",
    "Gastrointestinal: Do you have stomach pain, nausea, indigestion, or changes in bowels?",
    "Genitourinary: Do you notice frequent urination or changes in your sex life?",
    "Autonomic: Do you experience dry mouth, flushing, or excessive sweating?",
    "Behavior: Do you find yourself fidgeting, pacing, or looking tense/shaky?"
];

window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
window.currentQ = 0;
window.assessmentCompleted = false;

const answerLabels = ["Not present", "Mild", "Moderate", "Severe", "Very Severe"];

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

    // Hamilton Anxiety Rating Scale (HAM-A) Interpretation
    if (total <= 17) {
        result = "Mild anxiety severity. Keep maintaining your wellness.";
        severity = "low";
    } else if (total <= 24) {
        result = "Mild to Moderate anxiety severity. Relaxation exercises recommended.";
        severity = "mild";
    } else if (total <= 30) {
        result = "Moderate to Severe anxiety. Consider professional support soon.";
        severity = "moderate";
    } else {
        result = "Severe anxiety. Please consult a mental health professional immediately.";
        severity = "high";
    }

    const anxietyForm = document.getElementById('anxietyForm');
    if (anxietyForm) {
        anxietyForm.style.display = 'none';
    }

    window.latestAnxietyResult = `HAM-A Score: ${total}/56 – ${result}`;

    // Calculate percentage based on max score 56
    let lastAnxietyScore = Math.round((total / 56) * 100);

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
        window.zenTrack.addRecentActivity(`Completed HAM-A Assessment - Score: ${total}`);
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
        window.zenTrack.showNotification('✅ Assessment completed using HAM-A scale!', 'success');
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
          <p style="margin: 10px 0 0 0; font-size: 0.95rem; opacity: 0.9;">Results based on Hamilton Anxiety Rating Scale</p>
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
    }, 800);
}

async function generateNewQuestions() {
    console.warn('⚠️ AI question generation disabled for security reasons');
    return null;
}

async function startNewAssessment() {
    window.assessmentCompleted = false;
    window.zenTrackState.inAssessment = true;

    // Use standard HAM-A questions
    window.anxietyQuestions = [
        "Anxious Mood: Do you feel worried, irritable, or fear the worst will happen?",
        "Tension: Do you feel tense, restless, startle easily, or find it hard to relax?",
        "Fears: Do you have fears of the dark, strangers, crowds, or being alone?",
        "Insomnia: Do you have trouble falling asleep, staying asleep, or have nightmares?",
        "Intellectual: Do you find it hard to concentrate or have a poor memory?",
        "Depressed Mood: Have you lost interest in hobbies or feel sad/hopeless?",
        "Somatic (Muscular): Do you feel muscle pains, stiffness, or grind your teeth?",
        "Somatic (Sensory): Do you have ringing in ears, blurred vision, or hot/cold flashes?",
        "Cardiovascular: Do you notice a fast heart rate, palpitations, or chest pain?",
        "Respiratory: Do you feel pressure in your chest, sighing, or shortness of breath?",
        "Gastrointestinal: Do you have stomach pain, nausea, indigestion, or changes in bowels?",
        "Genitourinary: Do you notice frequent urination or changes in your sex life?",
        "Autonomic: Do you experience dry mouth, flushing, or excessive sweating?",
        "Behavior: Do you find yourself fidgeting, pacing, or looking tense/shaky?"
    ];

    window.anxietyAnswers = Array(window.anxietyQuestions.length).fill(null);
    window.currentQ = 0;

    const anxietyForm = document.getElementById('anxietyForm');
    if (anxietyForm) {
        anxietyForm.style.display = '';
    }

    window.zenTrack?.showNotification('📋 Starting Hamilton Anxiety Rating (HAM-A)...', 'info');

    renderAnxietyQuestion();
    showSection('anxietyAssessment');
}

window.startNewAssessment = startNewAssessment;
window.generateNewQuestions = generateNewQuestions;
