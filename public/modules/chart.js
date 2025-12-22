// 統計圖表功能
import { state, updateState } from './state.js';
import { elements } from './dom.js';

export function updateStats() {
  const total = state.todos.length;
  const completed = state.todos.filter(todo => todo.completed).length;
  const pending = total - completed;

  elements.completedTasksEl.textContent = completed;
  elements.pendingTasksEl.textContent = pending;

  updateChart(completed, pending);
}

export function initChart() {
  const ctx = document.getElementById('todoChart').getContext('2d');
  
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['已完成', '待完成'],
      datasets: [{
        data: [0, 0],
        backgroundColor: [
          'rgba(79, 172, 254, 0.8)',
          'rgba(245, 87, 108, 0.8)'
        ],
        borderColor: [
          'rgba(79, 172, 254, 1)',
          'rgba(245, 87, 108, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '65%',
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
  
  updateState('todoChart', chart);
}

export function updateChart(completed, pending) {
  if (state.todoChart) {
    state.todoChart.data.datasets[0].data = [completed, pending];
    state.todoChart.update();
  }
}
