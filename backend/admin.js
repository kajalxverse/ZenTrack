// ZenTrack Admin Panel JavaScript
const API_URL = 'http://localhost:5000/api';
let adminToken = null;
let currentEditId = null;
let currentEditType = null;

// ==================== Authentication ====================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (!data.user.is_admin) {
                showMessage('loginMessage', 'Only admin users can access this panel', 'error');
                return;
            }

            adminToken = data.access_token;
            localStorage.setItem('adminToken', adminToken);

            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');

            loadDashboard();
        } else {
            showMessage('loginMessage', data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Cannot connect to server. Make sure backend is running.', 'error');
        console.error(error);
    }
});

function logout() {
    adminToken = null;
    localStorage.removeItem('adminToken');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

// ==================== Dashboard ====================

async function loadDashboard() {
    await loadStats();
    await loadUsers();
    await loadTherapies();
    await loadMusic();
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('statsGrid').innerHTML = `
                <div class="stat-card">
                    <h3>${data.total_users}</h3>
                    <p>Total Users</p>
                </div>
                <div class="stat-card">
                    <h3>${data.total_chats}</h3>
                    <p>Total Chats</p>
                </div>
                <div class="stat-card">
                    <h3>${data.total_therapies}</h3>
                    <p>Active Therapies</p>
                </div>
                <div class="stat-card">
                    <h3>${data.total_music}</h3>
                    <p>Music Tracks</p>
                </div>
                <div class="stat-card">
                    <h3>${data.assessed_users}</h3>
                    <p>Assessed Users</p>
                </div>
                <div class="stat-card">
                    <h3>${data.assessment_rate}%</h3>
                    <p>Assessment Rate</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ==================== Users Management ====================

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${user.name || '-'}</td>
                    <td>${user.is_admin ? '<span class="badge admin">Admin</span>' : 'User'}</td>
                    <td>${user.has_completed_assessment ? '✅ Yes' : '❌ No'}</td>
                    <td>${user.last_anxiety_score || '-'}</td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>
                        ${!user.is_admin ? `<button class="action-btn delete" onclick="deleteUser(${user.id})">Delete</button>` : '-'}
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            showMessage('dashboardMessage', 'User deleted successfully', 'success');
            loadUsers();
            loadStats();
        } else {
            const data = await response.json();
            showMessage('dashboardMessage', data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        showMessage('dashboardMessage', 'Error deleting user', 'error');
    }
}

// ==================== Therapies Management ====================

async function loadTherapies() {
    try {
        const response = await fetch(`${API_URL}/admin/therapies`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('therapiesTableBody');
            tbody.innerHTML = data.therapies.map(therapy => `
                <tr>
                    <td>${therapy.id}</td>
                    <td>${therapy.title}</td>
                    <td>${therapy.category || '-'}</td>
                    <td>${therapy.duration_minutes || '-'} min</td>
                    <td>${therapy.difficulty_level || '-'}</td>
                    <td><span class="badge ${therapy.is_active ? 'active' : 'inactive'}">${therapy.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="editTherapy(${therapy.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteTherapy(${therapy.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading therapies:', error);
    }
}

function openTherapyModal() {
    currentEditId = null;
    currentEditType = 'therapy';
    document.getElementById('therapyModalTitle').textContent = 'Add New Therapy';
    document.getElementById('therapyForm').reset();
    document.getElementById('therapyModal').classList.add('active');
}

function closeTherapyModal() {
    document.getElementById('therapyModal').classList.remove('active');
}

async function editTherapy(therapyId) {
    try {
        const response = await fetch(`${API_URL}/therapies/${therapyId}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            const therapy = data.therapy;
            currentEditId = therapyId;
            currentEditType = 'therapy';

            document.getElementById('therapyModalTitle').textContent = 'Edit Therapy';
            document.getElementById('therapyTitle').value = therapy.title;
            document.getElementById('therapyDescription').value = therapy.description;
            document.getElementById('therapyCategory').value = therapy.category || '';
            document.getElementById('therapyDuration').value = therapy.duration_minutes || '';
            document.getElementById('therapyLevel').value = therapy.difficulty_level || 'beginner';
            document.getElementById('therapyBenefits').value = therapy.benefits || '';
            document.getElementById('therapyInstructions').value = therapy.instructions || '';

            document.getElementById('therapyModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading therapy:', error);
    }
}

document.getElementById('therapyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const therapyData = {
        title: document.getElementById('therapyTitle').value,
        description: document.getElementById('therapyDescription').value,
        category: document.getElementById('therapyCategory').value,
        duration_minutes: parseInt(document.getElementById('therapyDuration').value) || null,
        difficulty_level: document.getElementById('therapyLevel').value,
        benefits: document.getElementById('therapyBenefits').value,
        instructions: document.getElementById('therapyInstructions').value,
        is_active: true
    };

    try {
        let url = `${API_URL}/admin/therapies`;
        let method = 'POST';

        if (currentEditId) {
            url = `${API_URL}/admin/therapies/${currentEditId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(therapyData)
        });

        if (response.ok) {
            showMessage('dashboardMessage', `Therapy ${currentEditId ? 'updated' : 'created'} successfully`, 'success');
            closeTherapyModal();
            loadTherapies();
            loadStats();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to save therapy');
        }
    } catch (error) {
        alert('Error saving therapy');
        console.error(error);
    }
});

async function deleteTherapy(therapyId) {
    if (!confirm('Are you sure you want to delete this therapy?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/therapies/${therapyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            showMessage('dashboardMessage', 'Therapy deleted successfully', 'success');
            loadTherapies();
            loadStats();
        } else {
            const data = await response.json();
            showMessage('dashboardMessage', data.error || 'Failed to delete therapy', 'error');
        }
    } catch (error) {
        showMessage('dashboardMessage', 'Error deleting therapy', 'error');
    }
}

// ==================== Music Management ====================

async function loadMusic() {
    try {
        const response = await fetch(`${API_URL}/admin/music`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('musicTableBody');
            tbody.innerHTML = data.music.map(music => `
                <tr>
                    <td>${music.id}</td>
                    <td>${music.title}</td>
                    <td>${music.artist || '-'}</td>
                    <td>${music.category || '-'}</td>
                    <td>${formatDuration(music.duration_seconds)}</td>
                    <td>${music.play_count || 0}</td>
                    <td><span class="badge ${music.is_active ? 'active' : 'inactive'}">${music.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="action-btn edit" onclick="editMusic(${music.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteMusic(${music.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading music:', error);
    }
}

function openMusicModal() {
    currentEditId = null;
    currentEditType = 'music';
    document.getElementById('musicModalTitle').textContent = 'Add New Music';
    document.getElementById('musicForm').reset();
    document.getElementById('musicModal').classList.add('active');
}

function closeMusicModal() {
    document.getElementById('musicModal').classList.remove('active');
}

async function editMusic(musicId) {
    try {
        const response = await fetch(`${API_URL}/music`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (response.ok) {
            const music = data.music.find(m => m.id === musicId);
            if (music) {
                currentEditId = musicId;
                currentEditType = 'music';

                document.getElementById('musicModalTitle').textContent = 'Edit Music';
                document.getElementById('musicTitle').value = music.title;
                document.getElementById('musicArtist').value = music.artist || '';
                document.getElementById('musicDescription').value = music.description || '';
                document.getElementById('musicCategory').value = music.category || '';
                document.getElementById('musicDuration').value = music.duration_seconds || '';
                document.getElementById('musicUrl').value = music.audio_url;
                document.getElementById('musicMood').value = music.mood || '';

                document.getElementById('musicModal').classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error loading music:', error);
    }
}

document.getElementById('musicForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const musicData = {
        title: document.getElementById('musicTitle').value,
        artist: document.getElementById('musicArtist').value,
        description: document.getElementById('musicDescription').value,
        category: document.getElementById('musicCategory').value,
        duration_seconds: parseInt(document.getElementById('musicDuration').value) || null,
        audio_url: document.getElementById('musicUrl').value,
        mood: document.getElementById('musicMood').value,
        is_active: true
    };

    try {
        let url = `${API_URL}/admin/music`;
        let method = 'POST';

        if (currentEditId) {
            url = `${API_URL}/admin/music/${currentEditId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(musicData)
        });

        if (response.ok) {
            showMessage('dashboardMessage', `Music ${currentEditId ? 'updated' : 'created'} successfully`, 'success');
            closeMusicModal();
            loadMusic();
            loadStats();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to save music');
        }
    } catch (error) {
        alert('Error saving music');
        console.error(error);
    }
});

async function deleteMusic(musicId) {
    if (!confirm('Are you sure you want to delete this music?')) return;

    try {
        const response = await fetch(`${API_URL}/admin/music/${musicId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            showMessage('dashboardMessage', 'Music deleted successfully', 'success');
            loadMusic();
            loadStats();
        } else {
            const data = await response.json();
            showMessage('dashboardMessage', data.error || 'Failed to delete music', 'error');
        }
    } catch (error) {
        showMessage('dashboardMessage', 'Error deleting music', 'error');
    }
}

// ==================== UI Helpers ====================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatDuration(seconds) {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ==================== Auto-login if token exists ====================

window.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
        adminToken = savedToken;
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        loadDashboard();
    }
});
