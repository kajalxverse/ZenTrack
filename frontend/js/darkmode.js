// ZenTrack - Dark Mode Module
// Theme management with smooth transitions

const darkToggle = document.getElementById('darkToggle');
const darkIcon = document.getElementById('darkIcon');
const darkLabel = document.getElementById('darkLabel');

function setDarkMode(on) {
    const html = document.documentElement;
    const body = document.body;

    if (on) {
        html.classList.add('dark');
        body.classList.add('dark');
        if (darkIcon) darkIcon.textContent = "☀️";
        if (darkLabel) darkLabel.textContent = "Light Mode";
        localStorage.setItem('zentrack-dark', '1');

        // Update charts if they exist
        updateChartsTheme(true);
    } else {
        html.classList.remove('dark');
        body.classList.remove('dark');
        if (darkIcon) darkIcon.textContent = "🌙";
        if (darkLabel) darkLabel.textContent = "Dark Mode";
        localStorage.setItem('zentrack-dark', '0');

        // Update charts if they exist
        updateChartsTheme(false);
    }

    // Add transition effect
    body.style.transition = 'background 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
}

function updateChartsTheme(isDark) {
    const textColor = isDark ? '#818cf8' : '#6366f1';
    const gridColor = isDark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.1)';

    // Update main chart
    if (window.stressChart) {
        window.stressChart.options.plugins.legend.labels.color = textColor;
        window.stressChart.options.scales.x.ticks.color = textColor;
        window.stressChart.options.scales.y.ticks.color = textColor;
        window.stressChart.options.scales.x.grid.color = gridColor;
        window.stressChart.options.scales.y.grid.color = gridColor;
        window.stressChart.update('none');
    }

    // Update dashboard chart
    if (window.stressChartDashboard) {
        window.stressChartDashboard.options.plugins.legend.labels.color = textColor;
        window.stressChartDashboard.options.scales.x.ticks.color = textColor;
        window.stressChartDashboard.options.scales.y.ticks.color = textColor;
        window.stressChartDashboard.options.scales.x.grid.color = gridColor;
        window.stressChartDashboard.options.scales.y.grid.color = gridColor;
        window.stressChartDashboard.update('none');
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', function () {
    // Check saved preference
    const savedDarkMode = localStorage.getItem('zentrack-dark');
    if (savedDarkMode === '1') {
        setDarkMode(true);
    }

    // Toggle handler
    if (darkToggle) {
        darkToggle.onclick = function () {
            const isDark = document.documentElement.classList.contains('dark');
            setDarkMode(!isDark);

            // Show notification
            window.zenTrack?.showNotification(
                isDark ? 'Switched to light mode' : 'Switched to dark mode',
                'info'
            );
        };
    }

    // Keyboard shortcut: Ctrl/Cmd + D
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            const isDark = document.documentElement.classList.contains('dark');
            setDarkMode(!isDark);
        }
    });
});

// Export for global use
window.setDarkMode = setDarkMode;
