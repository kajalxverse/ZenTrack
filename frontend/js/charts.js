// ZenTrack - Charts Module
// Stress visualization using Chart.js

let stressChart = null;
let stressChartDashboard = null;

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
});

function initializeCharts() {
    // Initialize dashboard stress trend chart
    const ctxDashboard = document.getElementById('stressChartDashboard');
    if (ctxDashboard) {
        window.stressChartDashboard = new Chart(ctxDashboard.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Stress Level',
                    data: window.zenTrackState.stressData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6366f1',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#6366f1',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(99,102,241,0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return 'Stress Level: ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#6366f1',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: 'rgba(99,102,241,0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: {
                            color: '#6366f1',
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(99,102,241,0.1)',
                            drawBorder: false
                        },
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    // Initialize main stress chart
    const ctx = document.getElementById('stressChart');
    if (ctx) {
        window.stressChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Stress Level',
                    data: window.zenTrackState.stressData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6366f1',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#6366f1',
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(99,102,241,0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return 'Stress Level: ' + context.parsed.y + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#6366f1',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: 'rgba(99,102,241,0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: {
                            color: '#6366f1',
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            callback: function (value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(99,102,241,0.1)',
                            drawBorder: false
                        },
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }
}

// Update chart data
function updateChartData(newData) {
    if (window.stressChart) {
        window.stressChart.data.datasets[0].data = newData;
        window.stressChart.update('active');
    }

    if (window.stressChartDashboard) {
        window.stressChartDashboard.data.datasets[0].data = newData;
        window.stressChartDashboard.update('active');
    }

    window.zenTrackState.stressData = newData;
}

// Add new stress data point
function addStressDataPoint(value) {
    const data = window.zenTrackState.stressData;
    data.shift(); // Remove first element
    data.push(value); // Add new element
    updateChartData(data);
}

// Export functions
window.updateChartData = updateChartData;
window.addStressDataPoint = addStressDataPoint;
