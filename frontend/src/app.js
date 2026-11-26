// Blood Pressure Monitor - Simple Vanilla JS App

// API Configuration
const API_BASE_URL = '/api';

console.log('Blood Pressure Monitor app loaded');

// State
let currentUser = null;
let darkMode = false;
let users = [];
let readings = [];
let alerts = [];

// DOM Elements
const container = document.querySelector('.container');
const navLinks = document.querySelector('#navLinks');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderNav();
    showView('landing');
});

// State Management
function loadState() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
        darkMode = storedDarkMode === 'true';
        applyDarkMode();
    }
}

function saveState() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    localStorage.setItem('darkMode', darkMode.toString());
}

function applyDarkMode() {
    if (darkMode) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

// API Helper
async function apiGet(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

async function apiPost(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

async function apiPut(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PUT' });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

async function apiDelete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

// Navigation
function renderNav() {
    if (currentUser) {
        navLinks.innerHTML = `
            <a onclick="showView('dashboard')">Dashboard</a>
            <a onclick="showView('readings')">Readings</a>
            <a onclick="showView('users')">Users</a>
            <a onclick="showView('alerts')">Alerts</a>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        navLinks.innerHTML = `
            <a onclick="showView('login')">Login</a>
            <a onclick="showView('register')">Register</a>
        `;
    }
}

function showView(viewName) {
    // Clear container
    container.innerHTML = '';
    
    // Show appropriate view
    switch(viewName) {
        case 'landing':
            renderLanding();
            break;
        case 'login':
            renderLogin();
            break;
        case 'register':
            renderRegister();
            break;
        case 'dashboard':
            renderDashboard();
            break;
        case 'readings':
            renderReadings();
            break;
        case 'users':
            renderUsers();
            break;
        case 'alerts':
            renderAlerts();
            break;
        case 'add-reading':
            renderAddReading();
            break;
    }
}

// Views
function renderLanding() {
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem 2rem;">
            <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">🩺 Blood Pressure Monitor</h1>
            <p style="font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 2rem;">
                Track, analyze, and manage your blood pressure with ease
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; max-width: 800px; margin-left: auto; margin-right: auto;">
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                    <h3>Daily Trends</h3>
                    <p style="color: var(--text-secondary);">Visualize your blood pressure trends</p>
                </div>
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔔</div>
                    <h3>Smart Alerts</h3>
                    <p style="color: var(--text-secondary);">Get notified about high/low BP</p>
                </div>
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
                    <h3>Family Sharing</h3>
                    <p style="color: var(--text-secondary);">Multiple user profiles</p>
                </div>
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📱</div>
                    <h3>Mobile Friendly</h3>
                    <p style="color: var(--text-secondary);">Responsive design</p>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                <button class="btn btn-primary" onclick="showView('register')">Get Started</button>
                <button class="btn btn-secondary" onclick="showView('login')">Login</button>
            </div>
        </div>
    `;
}

function renderLogin() {
    container.innerHTML = `
        <div class="form-container">
            <h2 style="text-align: center; margin-bottom: 2rem;">Login</h2>
            <div id="loginError" class="error"></div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginUsername">Username</label>
                    <input type="text" id="loginUsername" required placeholder="Enter your username">
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" required placeholder="Enter your password">
                </div>
                <button type="submit">Login</button>
            </form>
            <p style="text-align: center; margin-top: 1rem;">
                Don't have an account? <a onclick="showView('register')">Register</a>
            </p>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        errorDiv.textContent = '';
        
        try {
            const user = await apiPost('/login', { username, password });
            currentUser = { id: user.id, name: user.name, username: user.username };
            saveState();
            renderNav();
            showView('dashboard');
        } catch (err) {
            errorDiv.textContent = 'Invalid username or password';
        }
    });
}

function renderRegister() {
    container.innerHTML = `
        <div class="form-container">
            <h2 style="text-align: center; margin-bottom: 2rem;">Register</h2>
            <div id="registerError" class="error"></div>
            <form id="registerForm">
                <div class="form-group">
                    <label for="regName">Full Name</label>
                    <input type="text" id="regName" required placeholder="Enter your full name">
                </div>
                <div class="form-group">
                    <label for="regUsername">Username</label>
                    <input type="text" id="regUsername" required placeholder="Choose a username">
                </div>
                <div class="form-group">
                    <label for="regPassword">Password</label>
                    <input type="password" id="regPassword" required placeholder="Choose a password">
                </div>
                <button type="submit">Register</button>
            </form>
            <p style="text-align: center; margin-top: 1rem;">
                Already have an account? <a onclick="showView('login')">Login</a>
            </p>
        </div>
    `;
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const errorDiv = document.getElementById('registerError');
        
        errorDiv.textContent = '';
        
        try {
            await apiPost('/users', { name, username, password });
            errorDiv.textContent = 'Registration successful! Please login.';
            setTimeout(() => showView('login'), 2000);
        } catch (err) {
            errorDiv.textContent = 'Failed to register. Username may already exist.';
        }
    });
}

function renderDashboard() {
    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Dashboard</h2>
        <div id="dashboardContent">
            <p>Loading dashboard...</p>
        </div>
    `;
    
    loadDashboardData();
}

async function loadDashboardData() {
    if (!currentUser) {
        showView('login');
        return;
    }
    
    try {
        const trends = await apiGet(`/users/${currentUser.id}/readings/daily-trends`);
        
        const summary = await apiGet(`/users/${currentUser.id}/readings/weekly-summary`);
        
        const readingsData = await apiGet(`/users/${currentUser.id}/readings`);
        readings = readingsData || [];
        
        renderDashboardContent(summary, trends);
    } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        container.querySelector('#dashboardContent').innerHTML = '<p>Error loading dashboard. Make sure the backend server is running.</p>';
    }
}

// Active chart instance (destroyed on re-render to avoid leaks)
let bpChartInstance = null;

function renderDashboardContent(summary, trends) {
    const dashDiv = container.querySelector('#dashboardContent');
    dashDiv.innerHTML = `
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="showView('add-reading')" style="width:auto;">+ Add Reading</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div class="card">
                <h3>Weekly Summary</h3>
                ${summary && summary.total_readings > 0 ? `
                    <div class="stats-grid">
                        <div class="stat">
                            <div class="stat-value">${Math.round(summary.avg_systolic || 0)} <span style="font-size: 1rem">mmHg</span></div>
                            <div class="stat-label">Avg Systolic</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${Math.round(summary.avg_diastolic || 0)} <span style="font-size: 1rem">mmHg</span></div>
                            <div class="stat-label">Avg Diastolic</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${Math.round(summary.avg_heart_rate || 0)}</div>
                            <div class="stat-label">Avg Heart Rate</div>
                        </div>
                    </div>
                    <div class="stats-grid" style="margin-top: 1rem;">
                        <div class="stat">
                            <div class="stat-value">${summary.total_readings || 0}</div>
                            <div class="stat-label">Total Readings</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${summary.max_systolic || 0}</div>
                            <div class="stat-label">Max Systolic</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${summary.min_systolic || 0}</div>
                            <div class="stat-label">Min Systolic</div>
                        </div>
                    </div>
                ` : '<p style="color:var(--text-secondary);padding:1rem 0;">No data available for the past week.</p>'}
            </div>
            
            <div class="card">
                <h3>Recent Readings</h3>
                ${readings.length > 0 ? `
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${readings.slice(0, 5).map(r => `
                            <li style="padding: 0.75rem; border-bottom: 1px solid var(--border-color);">
                                <div style="font-size:0.85rem;color:var(--text-secondary);">${formatDateTime(r.measurement_time)}</div>
                                <div style="margin-top:0.25rem;">
                                    <span style="font-weight:600;color: ${bpColor(r.systolic, r.diastolic)}">
                                        ${r.systolic}/${r.diastolic}
                                    </span>
                                    <span style="margin-left: 1rem;">HR: ${r.heart_rate}</span>
                                    ${r.notes ? '<span style="margin-left:0.5rem;color:var(--text-secondary);font-size:0.85rem;">— ' + r.notes + '</span>' : ''}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p style="color:var(--text-secondary);padding:1rem 0;">No recent readings.</p>'}
            </div>
        </div>

        <!-- Full-width chart card -->
        <div class="card" style="margin-top:1.5rem;" id="chartCard">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <h3 id="chartTitle">7-Day Trends</h3>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                    <select id="chartPeriod" onchange="changeChartPeriod(this.value)" style="padding:0.4rem 0.8rem;border-radius:4px;border:1px solid var(--border-color);font-size:0.85rem;">
                        <option value="7">7 Days</option>
                        <option value="30">30 Days</option>
                        <option value="365">1 Year</option>
                    </select>
                    <button id="resetZoomBtn" class="btn btn-secondary" style="width:auto;padding:0.4rem 0.8rem;font-size:0.85rem;display:none;" onclick="resetChartZoom()">Reset Zoom</button>
                    <button id="fullscreenBtn" class="btn btn-secondary" style="width:auto;padding:0.4rem 0.8rem;font-size:0.85rem;" onclick="openChartFullscreen()">⛶ Fullscreen</button>
                </div>
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;">
                Scroll to zoom · Drag to pan · Tap/hover a point for details
            </p>
            <div style="position:relative;width:100%;height:350px;">
                <canvas id="bpTrendChart"></canvas>
            </div>
        </div>
    `;

    renderBPChart(readings, 7);
}

function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function bpColor(sys, dia) {
    if (sys >= 140 || dia >= 90) return '#ef4444';
    if (sys >= 120 || dia >= 80) return '#f59e0b';
    if (sys < 90 || dia < 60)   return '#6366f1';
    return '#10b981';
}

function bpCategory(sys, dia) {
    if (sys >= 180 || dia >= 120) return 'Hypertensive Crisis';
    if (sys >= 140 || dia >= 90)  return 'High (Stage 2)';
    if (sys >= 130 || dia >= 80)  return 'High (Stage 1)';
    if (sys >= 120)               return 'Elevated';
    if (sys < 90 || dia < 60)     return 'Low';
    return 'Normal';
}

// Current chart period in days
let currentChartPeriod = 7;

function changeChartPeriod(days) {
    currentChartPeriod = parseInt(days);
    const titles = { 7: '7-Day Trends', 30: '30-Day Trends', 365: 'Yearly Trends' };
    const titleEl = document.getElementById('chartTitle');
    if (titleEl) titleEl.textContent = titles[days] || `${days}-Day Trends`;
    renderBPChart(readings, currentChartPeriod);
}

function renderBPChart(allReadings, days = 7) {
    // Destroy previous instance
    if (bpChartInstance) {
        bpChartInstance.destroy();
        bpChartInstance = null;
    }

    const canvas = document.getElementById('bpTrendChart');
    if (!canvas) return;

    // Filter to selected period and sort ascending
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const data = (allReadings || [])
        .filter(r => new Date(r.measurement_time).getTime() >= cutoff)
        .sort((a, b) => new Date(a.measurement_time) - new Date(b.measurement_time));

    const periodLabels = { 7: '7 days', 30: '30 days', 365: 'year' };
    const periodLabel = periodLabels[days] || `${days} days`;

    if (data.length === 0) {
        canvas.parentElement.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:4rem 0;">No readings in the last ${periodLabel}. Add a reading to see the chart.</p>`;
        return;
    }

    const labels = data.map(r => new Date(r.measurement_time));
    const systolicData = data.map(r => r.systolic);
    const diastolicData = data.map(r => r.diastolic);
    const heartRateData = data.map(r => r.heart_rate);

    // Store raw readings for tooltip access
    const rawData = data;

    const ctx = canvas.getContext('2d');

    bpChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Systolic',
                    data: systolicData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    fill: '+1',
                    borderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                },
                {
                    label: 'Diastolic',
                    data: diastolicData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: false,
                    borderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                },
                {
                    label: 'Heart Rate',
                    data: heartRateData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.08)',
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderDash: [6, 3],
                    tension: 0.3,
                    yAxisID: 'yHR',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(30,41,59,0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#e2e8f0',
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    displayColors: true,
                    callbacks: {
                        title: function(items) {
                            if (!items.length) return '';
                            const idx = items[0].dataIndex;
                            const r = rawData[idx];
                            const d = new Date(r.measurement_time);
                            return d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' })
                                   + '  ' + d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
                        },
                        afterBody: function(items) {
                            if (!items.length) return '';
                            const idx = items[0].dataIndex;
                            const r = rawData[idx];
                            const lines = [];
                            lines.push('');
                            lines.push('Category: ' + bpCategory(r.systolic, r.diastolic));
                            if (r.body_position) lines.push('Position: ' + r.body_position);
                            if (r.arm_used) lines.push('Arm: ' + r.arm_used);
                            if (r.medication) lines.push('Medication: ' + r.medication);
                            if (r.notes) lines.push('Notes: ' + r.notes);
                            return lines;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 16,
                        font: { size: 12 },
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null,
                    },
                    zoom: {
                        wheel: { enabled: true, speed: 0.1 },
                        pinch: { enabled: true },
                        mode: 'x',
                        onZoom: function() {
                            var btn = document.getElementById('resetZoomBtn');
                            if (btn) btn.style.display = 'inline-block';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy HH:mm',
                        displayFormats: { day: 'MMM d', hour: 'HH:mm' }
                    },
                    title: { display: true, text: 'Date', font: { size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { maxRotation: 0 }
                },
                y: {
                    title: { display: true, text: 'BP (mmHg)', font: { size: 12 } },
                    suggestedMin: 50,
                    suggestedMax: 180,
                    grid: { color: 'rgba(0,0,0,0.06)' },
                },
                yHR: {
                    position: 'right',
                    title: { display: true, text: 'Heart Rate (bpm)', font: { size: 12 } },
                    suggestedMin: 40,
                    suggestedMax: 120,
                    grid: { drawOnChartArea: false },
                }
            }
        }
    });
}

function resetChartZoom() {
    if (bpChartInstance) {
        bpChartInstance.resetZoom();
        var btn = document.getElementById('resetZoomBtn');
        if (btn) btn.style.display = 'none';
    }
}

// Fullscreen chart instance
let fullscreenChartInstance = null;

function openChartFullscreen() {
    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.className = 'chart-fullscreen-overlay';
    overlay.id = 'chartFullscreenOverlay';
    
    overlay.innerHTML = `
        <div class="chart-fullscreen-header">
            <h3>📊 7-Day Blood Pressure Trends</h3>
            <div class="controls">
                <button class="btn-icon" id="fsResetZoomBtn" onclick="resetFullscreenChartZoom()" style="display:none;">↩ Reset Zoom</button>
                <button class="btn-icon" onclick="closeChartFullscreen()">✕ Close</button>
            </div>
        </div>
        <p style="color:#9ca3af;font-size:0.85rem;padding:0 1rem;margin-bottom:0.5rem;">
            Scroll to zoom · Drag to pan · Tap/hover a point for details
        </p>
        <div class="chart-fullscreen-body">
            <canvas id="bpTrendChartFullscreen"></canvas>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Render the chart in fullscreen
    renderFullscreenChart();
    
    // Handle Escape key to close
    document.addEventListener('keydown', handleFullscreenEscape);
}

function handleFullscreenEscape(e) {
    if (e.key === 'Escape') {
        closeChartFullscreen();
    }
}

function closeChartFullscreen() {
    const overlay = document.getElementById('chartFullscreenOverlay');
    if (overlay) {
        // Destroy fullscreen chart instance
        if (fullscreenChartInstance) {
            fullscreenChartInstance.destroy();
            fullscreenChartInstance = null;
        }
        overlay.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleFullscreenEscape);
    }
}

function resetFullscreenChartZoom() {
    if (fullscreenChartInstance) {
        fullscreenChartInstance.resetZoom();
        var btn = document.getElementById('fsResetZoomBtn');
        if (btn) btn.style.display = 'none';
    }
}

function renderFullscreenChart() {
    const canvas = document.getElementById('bpTrendChartFullscreen');
    if (!canvas) return;

    // Filter to last 7 days and sort ascending
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const data = (readings || [])
        .filter(r => new Date(r.measurement_time).getTime() >= cutoff)
        .sort((a, b) => new Date(a.measurement_time) - new Date(b.measurement_time));

    if (data.length === 0) {
        canvas.parentElement.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:4rem 0;font-size:1.2rem;">No readings in the last 7 days.</p>';
        return;
    }

    const labels = data.map(r => new Date(r.measurement_time));
    const systolicData = data.map(r => r.systolic);
    const diastolicData = data.map(r => r.diastolic);
    const heartRateData = data.map(r => r.heart_rate);
    const rawData = data;

    const ctx = canvas.getContext('2d');

    fullscreenChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Systolic',
                    data: systolicData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    fill: '+1',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                },
                {
                    label: 'Diastolic',
                    data: diastolicData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.15)',
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                },
                {
                    label: 'Heart Rate',
                    data: heartRateData,
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167,139,250,0.1)',
                    fill: false,
                    borderWidth: 2.5,
                    pointRadius: 5,
                    pointHoverRadius: 9,
                    pointBackgroundColor: '#a78bfa',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderDash: [8, 4],
                    tension: 0.3,
                    yAxisID: 'yHR',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#e2e8f0',
                    cornerRadius: 10,
                    padding: 14,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    displayColors: true,
                    callbacks: {
                        title: function(items) {
                            if (!items.length) return '';
                            const idx = items[0].dataIndex;
                            const r = rawData[idx];
                            const d = new Date(r.measurement_time);
                            return d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })
                                   + '  ' + d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
                        },
                        afterBody: function(items) {
                            if (!items.length) return '';
                            const idx = items[0].dataIndex;
                            const r = rawData[idx];
                            const lines = [];
                            lines.push('');
                            lines.push('Category: ' + bpCategory(r.systolic, r.diastolic));
                            if (r.body_position) lines.push('Position: ' + r.body_position);
                            if (r.arm_used) lines.push('Arm: ' + r.arm_used);
                            if (r.activity_level) lines.push('Activity: ' + r.activity_level);
                            if (r.medication) lines.push('Medication: ' + r.medication);
                            if (r.notes) lines.push('Notes: ' + r.notes);
                            return lines;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 14 },
                        color: '#e2e8f0',
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: null,
                    },
                    zoom: {
                        wheel: { enabled: true, speed: 0.1 },
                        pinch: { enabled: true },
                        mode: 'x',
                        onZoom: function() {
                            var btn = document.getElementById('fsResetZoomBtn');
                            if (btn) btn.style.display = 'inline-block';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy HH:mm',
                        displayFormats: { day: 'MMM d', hour: 'HH:mm' }
                    },
                    title: { display: true, text: 'Date', font: { size: 14 }, color: '#9ca3af' },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: { maxRotation: 0, color: '#9ca3af', font: { size: 12 } }
                },
                y: {
                    title: { display: true, text: 'Blood Pressure (mmHg)', font: { size: 14 }, color: '#9ca3af' },
                    suggestedMin: 50,
                    suggestedMax: 180,
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    ticks: { color: '#9ca3af', font: { size: 12 } }
                },
                yHR: {
                    position: 'right',
                    title: { display: true, text: 'Heart Rate (bpm)', font: { size: 14 }, color: '#9ca3af' },
                    suggestedMin: 40,
                    suggestedMax: 120,
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#9ca3af', font: { size: 12 } }
                }
            }
        }
    });
}

function renderReadings() {
    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Blood Pressure Readings</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>Recent Readings</h3>
            <button class="btn btn-primary" onclick="exportCSV()">Export CSV</button>
        </div>
        <div id="readingsContent">
            <p>Loading readings...</p>
        </div>
    `;
    
    loadReadings();
}

async function loadReadings() {
    if (!currentUser) {
        showView('login');
        return;
    }
    
    try {
        readings = await apiGet(`/users/${currentUser.id}/readings`);
        renderReadingsTable();
    } catch (err) {
        console.error('Failed to fetch readings:', err);
        container.querySelector('#readingsContent').innerHTML = '<p>Error loading readings. Make sure the backend server is running.</p>';
    }
}

function renderReadingsTable() {
    container.querySelector('#readingsContent').innerHTML = readings.length > 0 ? `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Date/Time</th>
                        <th>Systolic</th>
                        <th>Diastolic</th>
                        <th>Heart Rate</th>
                        <th>Position</th>
                        <th>Arm</th>
                        <th>Activity</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${readings.map(r => `
                        <tr>
                            <td>${r.measurement_time.split('T')[0]} ${r.measurement_time.split('T')[1]?.split(':')[0]}:${r.measurement_time.split('T')[1]?.split(':')[1]}</td>
                            <td style="color: ${r.systolic >= 140 ? '#ef4444' : '#10b981'}">${r.systolic}</td>
                            <td style="color: ${r.diastolic >= 90 ? '#ef4444' : '#10b981'}">${r.diastolic}</td>
                            <td>${r.heart_rate}</td>
                            <td>${r.body_position || '-'}</td>
                            <td>${r.arm_used || '-'}</td>
                            <td>${r.activity_level || '-'}</td>
                            <td>${r.notes || '-'}</td>
                            <td>
                                <button class="btn btn-danger" onclick="deleteReading(${r.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    ` : '<p>No readings yet. Add your first reading!</p>';
}

function deleteReading(id) {
    if (confirm('Are you sure you want to delete this reading?')) {
        apiDelete(`/users/${currentUser.id}/readings/${id}`)
            .then(() => {
                readings = readings.filter(r => r.id !== id);
                renderReadingsTable();
            })
            .catch(err => {
                alert('Failed to delete reading: ' + err.message);
            });
    }
}

function exportCSV() {
    window.location.href = `${API_BASE_URL}/users/${currentUser.id}/readings/export`;
}

function renderUsers() {
    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Select User</h2>
        <div id="usersContent">
            <p>Loading users...</p>
        </div>
    `;
    
    loadUsers();
}

async function loadUsers() {
    try {
        users = await apiGet('/users');
        renderUsersList();
    } catch (err) {
        console.error('Failed to fetch users:', err);
        container.querySelector('#usersContent').innerHTML = '<p>Error loading users.</p>';
    }
}

function renderUsersList() {
    container.querySelector('#usersContent').innerHTML = users.length > 0 ? `
        ${users.map(u => `
            <div class="card" style="cursor: pointer; margin-bottom: 1rem; border: ${currentUser && currentUser.id === u.id ? '2px solid var(--primary-color)' : 'none'};" onclick="selectUser(${u.id})">
                <h3>${u.name}</h3>
                <p>@${u.username}</p>
                ${currentUser && currentUser.id === u.id ? '<p style="color: var(--primary-color); font-weight: 500;">Currently selected</p>' : ''}
            </div>
        `).join('')}
        
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="showView('register')">+ Add New User</button>
    ` : '<p>No users found. Please register a new user.</p>';
}

function selectUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        currentUser = { id: user.id, name: user.name, username: user.username };
        saveState();
        renderNav();
        showView('dashboard');
    }
}

function renderAlerts() {
    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Alerts & Notifications</h2>
        <div id="alertsContent">
            <p>Loading alerts...</p>
        </div>
    `;
    
    loadAlerts();
}

async function loadAlerts() {
    if (!currentUser) {
        showView('login');
        return;
    }
    
    try {
        alerts = await apiGet(`/users/${currentUser.id}/alerts`);
        renderAlertsList();
    } catch (err) {
        console.error('Failed to fetch alerts:', err);
        container.querySelector('#alertsContent').innerHTML = '<p>Error loading alerts.</p>';
    }
}

function renderAlertsList() {
    const unreadCount = alerts.filter(a => !a.is_read).length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    
    container.querySelector('#alertsContent').innerHTML = `
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div class="stat" style="text-align: center;">
                <div class="stat-value">${unreadCount}</div>
                <div class="stat-label">Unread</div>
            </div>
            <div class="stat" style="text-align: center;">
                <div class="stat-value">${warningCount}</div>
                <div class="stat-label">Warnings</div>
            </div>
            <div class="stat" style="text-align: center;">
                <div class="stat-value">${alerts.length}</div>
                <div class="stat-label">Total</div>
            </div>
        </div>
        
        ${alerts.length > 0 ? alerts.map(a => `
            <div class="card" style="background: ${getAlertColor(a.severity)}; border-left: 4px solid ${getAlertColor(a.severity)}; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <div>
                        <span style="font-size: 1.5rem;">${getAlertIcon(a.severity, a.alert_type)}</span>
                        <span style="margin-left: 0.5rem; font-weight: 500; color: ${getAlertTextColor(a.severity)};">
                            ${a.alert_type.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">${a.created_at.split('T')[0]}</span>
                </div>
                <p style="color: var(--text-color); line-height: 1.5;">${a.message}</p>
                ${!a.is_read ? '<p style="text-align: right; margin-top: 0.5rem;"><button class="btn btn-secondary" onclick="markAlertAsRead(' + a.id + ')">✓ Mark as read</button></p>' : ''}
            </div>
        `).join('') : '<p>No alerts. All systems normal! 🎉</p>'}
    `;
}

function getAlertIcon(severity, type) {
    if (type === 'high_bp') return '🩸';
    if (type === 'low_bp') return '📉';
    if (type === 'high_heart_rate') return '❤️‍🔥';
    if (type === 'low_heart_rate') return '❤️‍🩹';
    return '⚠️';
}

function getAlertColor(severity) {
    if (severity === 'warning') return '#fef3c7';
    if (severity === 'danger') return '#fee2e2';
    return '#f3f4f6';
}

function getAlertTextColor(severity) {
    if (severity === 'warning') return '#92400e';
    if (severity === 'danger') return '#991b1b';
    return '#374151';
}

function markAlertAsRead(alertId) {
    apiPut(`/users/${currentUser.id}/alerts/${alertId}/read`)
        .then(() => {
            alerts = alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a);
            renderAlertsList();
        })
        .catch(err => {
            alert('Failed to mark alert as read: ' + err.message);
        });
}

function renderAddReading() {
    container.innerHTML = `
        <h2 style="margin-bottom: 1.5rem;">Record Blood Pressure</h2>
        <div class="form-container">
            <h3 style="text-align: center; margin-bottom: 2rem;">📝 Record Blood Pressure</h3>
            
            <div style="display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; padding: 1rem; background: var(--card-bg); border-radius: 8px;">
                <div style="text-align: center;">
                    <div id="systolicDisplay" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">--</div>
                    <div style="color: var(--text-secondary);">Systolic (mmHg)</div>
                    <div id="systolicStatus" style="font-size: 0.875rem; color: #10b981;">Normal: 90-120</div>
                </div>
                <div style="text-align: center;">
                    <div id="diastolicDisplay" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">--</div>
                    <div style="color: var(--text-secondary);">Diastolic (mmHg)</div>
                    <div id="diastolicStatus" style="font-size: 0.875rem; color: #10b981;">Normal: 60-80</div>
                </div>
            </div>
            
            <form id="readingForm">
                <div class="form-group">
                    <label for="systolic">Systolic Pressure *</label>
                    <input type="number" id="systolic" min="50" max="250" required placeholder="e.g., 120">
                </div>
                
                <div class="form-group">
                    <label for="diastolic">Diastolic Pressure *</label>
                    <input type="number" id="diastolic" min="30" max="150" required placeholder="e.g., 80">
                </div>
                
                <div class="form-group">
                    <label for="heartRate">Heart Rate (bpm) *</label>
                    <input type="number" id="heartRate" min="30" max="220" required placeholder="e.g., 72">
                </div>
                
                <div class="form-group">
                    <label for="bodyPosition">Body Position</label>
                    <select id="bodyPosition">
                        <option value="standing">Standing</option>
                        <option value="sitting">Sitting</option>
                        <option value="lying">Lying Down</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="armUsed">Arm Used</label>
                    <select id="armUsed">
                        <option value="left">Left Arm</option>
                        <option value="right">Right Arm</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="activityLevel">Activity Level</label>
                    <select id="activityLevel">
                        <option value="resting">Resting</option>
                        <option value="light">Light Activity</option>
                        <option value="moderate">Moderate Activity</option>
                        <option value="strenuous">Strenuous Activity</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="medication">Medication Taken</label>
                    <input type="text" id="medication" placeholder="e.g., Lisinopril 10mg">
                </div>
                
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" placeholder="Any additional notes..." style="min-height: 100px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="button" class="btn btn-secondary" onclick="resetForm()">Reset</button>
                    <button type="submit" class="btn btn-primary">Save Reading</button>
                </div>
            </form>
        </div>
    `;
    
    // Add event listeners for real-time display updates
    ['systolic', 'diastolic'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateDisplay);
    });
    
    document.getElementById('readingForm').addEventListener('submit', handleFormSubmit);
}

function updateDisplay() {
    const systolic = document.getElementById('systolic').value;
    const diastolic = document.getElementById('diastolic').value;
    
    document.getElementById('systolicDisplay').textContent = systolic || '--';
    document.getElementById('diastolicDisplay').textContent = diastolic || '--';
    
    if (systolic) {
        const num = parseInt(systolic);
        const status = num >= 140 ? 'High' : (num >= 120 ? 'Elevated' : (num < 90 ? 'Low' : 'Normal'));
        const color = num >= 140 || num < 90 ? '#ef4444' : (num >= 120 ? '#f59e0b' : '#10b981');
        document.getElementById('systolicStatus').textContent = status;
        document.getElementById('systolicStatus').style.color = color;
    }
    
    if (diastolic) {
        const num = parseInt(diastolic);
        const status = num >= 90 ? 'High' : (num >= 80 ? 'Elevated' : (num < 60 ? 'Low' : 'Normal'));
        const color = num >= 90 || num < 60 ? '#ef4444' : (num >= 80 ? '#f59e0b' : '#10b981');
        document.getElementById('diastolicStatus').textContent = status;
        document.getElementById('diastolicStatus').style.color = color;
    }
}

function resetForm() {
    document.getElementById('systolic').value = '';
    document.getElementById('diastolic').value = '';
    document.getElementById('heartRate').value = '';
    document.getElementById('bodyPosition').value = 'standing';
    document.getElementById('armUsed').value = 'left';
    document.getElementById('activityLevel').value = 'resting';
    document.getElementById('medication').value = '';
    document.getElementById('notes').value = '';
    updateDisplay();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const reading = {
        user_id: currentUser.id,
        systolic: parseInt(document.getElementById('systolic').value),
        diastolic: parseInt(document.getElementById('diastolic').value),
        heart_rate: parseInt(document.getElementById('heartRate').value),
        notes: document.getElementById('notes').value,
        medication: document.getElementById('medication').value,
        body_position: document.getElementById('bodyPosition').value,
        arm_used: document.getElementById('armUsed').value,
        activity_level: document.getElementById('activityLevel').value
    };
    
    try {
        const newReading = await apiPost(`/users/${currentUser.id}/readings`, reading);
        readings.unshift(newReading);
        alert('Reading saved successfully!');
        showView('readings');
    } catch (err) {
        alert('Failed to save reading. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    renderNav();
    showView('landing');
}
