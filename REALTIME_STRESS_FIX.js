// Real-time Stress Calculation Function
// Add this code to assessment.html after the selectOption function

// Calculate and update real-time stress
function updateRealtimeStress() {
    // Calculate current stress based on answered questions
    const answeredCount = answers.filter(a => a !== undefined).length;

    if (answeredCount === 0) {
        document.getElementById('realtimeStress').textContent = '0%';
        document.getElementById('realtimeLevel').textContent = 'Not Assessed';
        document.getElementById('realtimeStress').style.color = 'var(--text-primary)';
        return;
    }

    // Calculate total score from answered questions
    const totalScore = answers.reduce((sum, val) => sum + (val || 0), 0);
    // Maximum possible score for 15 questions with 0-4 scale = 60
    const maxScore = 60;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Determine stress level and color
    let level, color;
    if (percentage <= 25) {
        level = 'Low Stress';
        color = '#10b981'; // Green
    } else if (percentage <= 50) {
        level = 'Moderate Stress';
        color = '#f59e0b'; // Orange
    } else {
        level = 'High Stress';
        color = '#ef4444'; // Red
    }

    document.getElementById('realtimeStress').textContent = percentage + '%';
    document.getElementById('realtimeLevel').textContent = level;
    document.getElementById('realtimeStress').style.color = color;
    document.getElementById('realtimeLevel').style.color = color;
}

// UPDATE selectOption function - add this line after line 367:
// updateRealtimeStress();

// The updated selectOption function should look like this:
/*
function selectOption(index) {
    answers[currentQuestion] = index;
    
    // Visual feedback
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    buttons[index].classList.add('selected');
    
    // Update real-time stress - ADD THIS LINE
    updateRealtimeStress();
    
    // Auto-advance after a short delay for visual feedback
    setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            renderQuestion();
        } else {
            // On last question, just update the submit button
            renderQuestion();
        }
    }, 300);
}
*/
