// 主應用入口
import { checkAuth } from './auth.js';
import { loadTeams, loadTodos } from './api.js';
import { initChart } from './chart.js';
import { setupEventListeners, switchToCalendarView, switchToListView } from './events.js';
import { selectTeam, showTeamSettings, showTodoDetail } from './ui.js';
import { toggleTodo, removeMember } from './api.js';
import { loadStateFromStorage, updateState } from './state.js';
import { renderTeams } from './render.js';
import { state } from './state.js';
import { elements } from './dom.js';

// 暴露全局函數供HTML使用
window.selectTeam = selectTeam;
window.showTeamSettings = showTeamSettings;
window.showTodoDetail = showTodoDetail;
window.toggleTodo = toggleTodo;
window.removeMember = removeMember;

// 恢復上次的狀態
async function restoreState() {
  const hasState = loadStateFromStorage();
  
  if (hasState) {
    // 等待團隊載入完成
    await loadTeams();
    await loadTodos();
    
    // 渲染團隊列表（會自動根據 state.currentTeamId 設置 active）
    renderTeams();
    
    // 設置當前團隊的標題
    if (state.currentTeamId !== null) {
      const team = state.teams.find(t => t.id === state.currentTeamId);
      if (team) {
        elements.teamNameHeader.textContent = team.name;
      }
    } else {
      elements.teamNameHeader.textContent = '個人任務';
    }
    
    // 恢復視圖
    if (state.currentView === 'calendar') {
      switchToCalendarView();
    } else {
      switchToListView();
    }
    
    // 恢復篩選按鈕狀態
    const filterBtn = document.querySelector(`.filter-btn[data-filter="${state.currentFilter}"]`);
    if (filterBtn) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      filterBtn.classList.add('active');
    }
    
    // 恢復待辦詳情面板
    if (state.selectedTodoId) {
      // 等待渲染完成後再打開詳情
      setTimeout(() => {
        const todo = state.todos.find(t => t.id === state.selectedTodoId);
        if (todo) {
          showTodoDetail(state.selectedTodoId);
        } else {
          // 如果待辦不存在（可能已被刪除），清除狀態
          updateState('selectedTodoId', null);
        }
      }, 100);
    }
  }
}

// 初始化應用
window.addEventListener('load', async () => {
  initChart();
  checkAuth();
  setupEventListeners();
  await restoreState();
  // 如果沒有保存的狀態，執行正常載入
  if (!loadStateFromStorage()) {
    loadTeams();
    loadTodos();
  }
});
