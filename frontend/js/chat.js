// ZenTrack - Chat Module (Complete Fixed Version with Cooldown)
// Backend-connected AI chatbot with proper error handling and rate limit protection

// Use global API_BASE_URL from config.js (don't redeclare)
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'http://localhost:5000/api';
}

// Stress tips (fallback)
const stressTips = [
    "🧘‍♀️ Practice 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s",
    "🚶‍♂️ Take a 20-minute walk daily",
    "😴 Maintain a regular sleep schedule",
    "📱 Take breaks from social media",
    "🎵 Listen to calming music",
    "📝 Journal your thoughts",
    "☕ Limit caffeine intake",
    "🤝 Connect with friends",
    "🧘 Practice yoga or meditation",
    "😊 Do something you enjoy daily"
];

// Cooldown state to prevent API spam
let isCoolingDown = false;
let cooldownTimer = null;

// Initialize chat
function initializeChat() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    if (chatBox.children.length === 0) {
        const welcomeMessage = `👋 Hello! I'm your ZenTrack AI assistant.

I can help you with:
• Reducing stress and anxiety
• Learning meditation techniques
• Improving sleep quality
• Enhancing mental wellness

Feel free to ask me anything! 😊`;

        addMessage(welcomeMessage, 'bot', true);
    }
}

// Add message to chat
function addMessage(text, sender = 'user', isHTML = false, id = null) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;

    const messageDiv = document.createElement('div');

    if (id) messageDiv.id = id;

    messageDiv.style.cssText = `
        margin-bottom: 15px;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 85%;
        word-wrap: break-word;
        animation: fadeInUp 0.3s ease;
        ${sender === 'user'
            ? 'background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; margin-left: auto; text-align: right;'
            : 'background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0;'}
    `;

    if (isHTML) {
        messageDiv.innerHTML = text;
    } else {
        messageDiv.textContent = text;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    return messageDiv;
}

// Send message to backend with cooldown protection
async function sendMessageGemini() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.querySelector('button[onclick="sendMessageGemini()"]') ||
        document.querySelector('#sendBtn');

    if (!chatInput) {
        console.error('Chat input not found');
        return;
    }

    const message = chatInput.value.trim();

    if (!message) {
        if (window.zenTrack && window.zenTrack.showNotification) {
            window.zenTrack.showNotification('Please type a message', 'warning');
        } else {
            alert('Please type a message');
        }
        return;
    }

    // Check if cooling down
    if (isCoolingDown) {
        addMessage("⏳ Please wait a few seconds before sending another message", 'bot');
        if (window.zenTrack && window.zenTrack.showNotification) {
            window.zenTrack.showNotification('Please wait before sending another message', 'warning');
        }
        return;
    }

    // Check if user is logged in
    const authToken = localStorage.getItem('zentrack_token');
    if (!authToken) {
        addMessage(message, 'user');
        chatInput.value = '';

        const loaderId = 'loader-' + Date.now();
        addMessage(`
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="loading"></div>
                <span>Thinking...</span>
            </div>
        `, 'bot', true, loaderId);

        setTimeout(() => {
            const loaderElement = document.getElementById(loaderId);
            if (loaderElement) loaderElement.remove();

            const tip = stressTips[Math.floor(Math.random() * stressTips.length)];
            addMessage(`⚠️ Please login to use AI chatbot. Here's a quick tip: ${tip}`, 'bot');
        }, 1000);

        return;
    }

    // Disable send button temporarily (8 seconds)
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';

        setTimeout(() => {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.cursor = 'pointer';
        }, 8000);
    }

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    if (window.zenTrack && window.zenTrack.addRecentActivity) {
        window.zenTrack.addRecentActivity('Chatted with AI assistant');
    }

    // Show loading
    const loaderId = 'loader-' + Date.now();
    addMessage(`
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="loading"></div>
            <span>AI is thinking...</span>
        </div>
    `, 'bot', true, loaderId);

    try {
        console.log('Sending message to backend:', message);

        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ message: message })
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);

        // Remove loading
        const loaderElement = document.getElementById(loaderId);
        if (loaderElement) loaderElement.remove();

        if (!response.ok) {
            throw new Error(result.error || result.message || `Server error: ${response.status}`);
        }

        // Check for QUOTA_ERROR
        if (!result.success && result.type === 'QUOTA_ERROR') {
            addMessage(result.response || result.message, 'bot');

            // Set cooldown based on retry_after
            const retryAfter = result.retry_after || 60;
            isCoolingDown = true;

            if (window.zenTrack && window.zenTrack.showNotification) {
                window.zenTrack.showNotification(`⏰ Please wait ${retryAfter} seconds before trying again`, 'warning');
            }

            // Clear existing timer if any
            if (cooldownTimer) clearTimeout(cooldownTimer);

            // Set new cooldown timer
            cooldownTimer = setTimeout(() => {
                isCoolingDown = false;
                if (window.zenTrack && window.zenTrack.showNotification) {
                    window.zenTrack.showNotification('✅ You can send messages again!', 'success');
                }
            }, retryAfter * 1000);

            return;
        }

        // Add bot response
        if (result.response) {
            addMessage(result.response, 'bot');
        } else if (result.message) {
            addMessage(result.message, 'bot');
        } else {
            throw new Error('No response from AI');
        }

        // Set a short cooldown to prevent rapid-fire messages (3 seconds)
        isCoolingDown = true;
        setTimeout(() => {
            isCoolingDown = false;
        }, 3000);

    } catch (error) {
        console.error('Chat error:', error);

        // Remove loading
        const loaderElement = document.getElementById(loaderId);
        if (loaderElement) loaderElement.remove();

        // Show error with fallback tip
        const tip = stressTips[Math.floor(Math.random() * stressTips.length)];
        addMessage(`❌ ${error.message}. Here's a quick tip: ${tip}`, 'bot');

        if (window.zenTrack && window.zenTrack.showNotification) {
            window.zenTrack.showNotification('Chat error - using fallback', 'error');
        }
    }
}

// Quick tip
async function showQuickTip() {
    const tip = stressTips[Math.floor(Math.random() * stressTips.length)];
    addMessage(tip, 'bot');

    if (window.zenTrack && window.zenTrack.showNotification) {
        window.zenTrack.showNotification('💡 Quick tip!', 'success');
    }
}

// Clear chat
async function clearChat() {
    const authToken = localStorage.getItem('zentrack_token');

    if (authToken) {
        try {
            await fetch(`${API_BASE_URL}/chat/clear`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
        } catch (error) {
            console.error('Failed to clear chat on backend:', error);
        }
    }

    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.innerHTML = '';

    initializeChat();

    if (window.zenTrack && window.zenTrack.showNotification) {
        window.zenTrack.showNotification('🗑️ Chat cleared!', 'info');
    }
}

// Load chat history
async function loadChatHistory() {
    const authToken = localStorage.getItem('zentrack_token');

    if (!authToken) {
        initializeChat();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/chat/history?limit=20`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load history');
        }

        const result = await response.json();

        if (result.history && result.history.length > 0) {
            const chatBox = document.getElementById('chatBox');
            if (chatBox) chatBox.innerHTML = '';

            initializeChat();

            result.history.reverse().forEach(chat => {
                addMessage(chat.user_message, 'user');
                addMessage(chat.bot_response, 'bot');
            });
        } else {
            initializeChat();
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
        initializeChat();
    }
}

// Enter key support
document.addEventListener('DOMContentLoaded', function () {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageGemini();
            }
        });
    }

    // Load chat when section is shown
    const chatFeature = document.getElementById('chatFeature');
    if (chatFeature) {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'style') {
                    const display = window.getComputedStyle(chatFeature).display;
                    if (display !== 'none') {
                        loadChatHistory();
                    }
                }
            });
        });

        observer.observe(chatFeature, { attributes: true });
    }
});

// Loading animation
const style = document.createElement('style');
style.textContent = `
    .loading {
        width: 20px;
        height: 20px;
        border: 3px solid #e2e8f0;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Export to window
window.sendMessageGemini = sendMessageGemini;
window.clearChat = clearChat;
window.showQuickTip = showQuickTip;
window.initializeChat = initializeChat;

console.log('✅ Chat module loaded with cooldown protection');
