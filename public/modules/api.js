// API 請求函數
import { API_BASE_URL } from './config.js';
import { state, updateState } from './state.js';
import { getToken, showMessage } from './utils.js';
import { renderTodos, renderTeams, renderTeamMembers, renderCalendar } from './render.js';
import { updateStats } from './chart.js';
import { elements } from './dom.js';

// ==================== API 請求輔助函數 ====================

/**
 * 統一的 API 請求處理
 */
const apiRequest = async (url, options = {}) => {
  const token = getToken();
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || '請求失敗');
    }
    
    return data;
  } catch (error) {
    console.error('API 請求錯誤:', error);
    throw error;
  }
};

// ==================== 待辦事項 API ====================

export async function loadTodos() {
  try {
    let url = `${API_BASE_URL}/todos`;
    if (state.currentTeamId !== null) {
      url += `?team_id=${state.currentTeamId}`;
    }
    
    const data = await apiRequest(url);
    
    updateState('todos', data.todos);
    updateState('allTodos', data.todos);
    renderTodos();
    updateStats();
    
    if (elements.calendarView?.style.display !== 'none') {
      renderCalendar();
    }
  } catch (error) {
    showMessage('載入待辦事項失敗', 'error');
  }
}

export async function toggleTodo(id) {
  try {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    await apiRequest(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !todo.completed })
    });

    await loadTodos();
  } catch (error) {
    showMessage(error.message || '更新失敗', 'error');
  }
}

export async function deleteTodo(id) {
  if (!confirm('確定要刪除此待辦事項嗎？')) {
    return;
  }

  try {
    await apiRequest(`${API_BASE_URL}/todos/${id}`, { method: 'DELETE' });
    
    showMessage('待辦事項已刪除', 'success');
    const { closeDetailPanel } = await import('./ui.js');
    closeDetailPanel();
    await loadTodos();
  } catch (error) {
    showMessage(error.message || '刪除失敗', 'error');
  }
}

// ==================== 團隊 API ====================

export async function loadTeams() {
  try {
    const data = await apiRequest(`${API_BASE_URL}/teams`);
    updateState('teams', data.teams);
    renderTeams();
  } catch (error) {
    showMessage('載入團隊失敗', 'error');
  }
}

export async function loadTeamMembers(teamId) {
  try {
    const data = await apiRequest(`${API_BASE_URL}/teams/${teamId}/members`);
    updateState('teamMembers', data.members);
    renderTeamMembers();
  } catch (error) {
    showMessage('載入成員失敗', 'error');
  }
}

export async function loadTeamMembersForAssignment(teamId) {
  try {
    const data = await apiRequest(`${API_BASE_URL}/teams/${teamId}/members`);
    updateState('teamMembers', data.members);
  } catch (error) {
    console.error('載入成員錯誤:', error);
  }
}

export async function updateTeam(teamId, updateData) {
  try {
    await apiRequest(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    showMessage('團隊已更新', 'success');
    await loadTeams();
    
    if (updateData.name) {
      const teamNameEl = document.getElementById('managementTeamName');
      if (teamNameEl) {
        teamNameEl.textContent = updateData.name;
      }
    }
  } catch (error) {
    showMessage(error.message || '更新失敗', 'error');
  }
}

export async function removeMember(userId) {
  if (!confirm('確定要移除此成員嗎？')) {
    return;
  }
  
  try {
    await apiRequest(`${API_BASE_URL}/teams/${state.currentTeamId}/members/${userId}`, {
      method: 'DELETE'
    });
    
    showMessage('成員已移除', 'success');
    await Promise.all([
      loadTeamMembers(state.currentTeamId),
      loadTeams()
    ]);
  } catch (error) {
    showMessage(error.message || '移除成員失敗', 'error');
  }
}
