// 全局狀態管理
export const state = {
  todos: [],
  teams: [],
  teamMembers: [],
  currentFilter: 'all',
  currentTeamId: null,
  selectedTodoId: null,
  todoChart: null,
  currentUserId: null,
  currentCalendarYear: new Date().getFullYear(),
  currentCalendarMonth: new Date().getMonth(),
  allTodos: [],
  currentView: 'list' // 'list' 或 'calendar'
};

// 狀態更新輔助函數
export function updateState(key, value) {
  state[key] = value;
  // 保存特定狀態到 localStorage
  if (['currentFilter', 'currentTeamId', 'currentView', 'selectedTodoId'].includes(key)) {
    saveStateToStorage();
  }
}

export function getState(key) {
  return state[key];
}

// 保存狀態到 localStorage
export function saveStateToStorage() {
  const stateToSave = {
    currentFilter: state.currentFilter,
    currentTeamId: state.currentTeamId,
    currentView: state.currentView,
    selectedTodoId: state.selectedTodoId
  };
  localStorage.setItem('appState', JSON.stringify(stateToSave));
}

// 從 localStorage 載入狀態
export function loadStateFromStorage() {
  try {
    const saved = localStorage.getItem('appState');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.currentFilter = parsed.currentFilter || 'all';
      state.currentTeamId = parsed.currentTeamId !== undefined ? parsed.currentTeamId : null;
      state.currentView = parsed.currentView || 'list';
      state.selectedTodoId = parsed.selectedTodoId || null;
      return true;
    }
  } catch (error) {
    console.error('載入狀態失敗:', error);
  }
  return false;
}
