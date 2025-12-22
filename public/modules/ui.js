// UI 控制函數
import { state, updateState } from './state.js';
import { elements } from './dom.js';
import { escapeHtml, closeSidebarOnMobile } from './utils.js';
import { loadTodos, loadTeams, loadTeamMembers, loadTeamMembersForAssignment, deleteTodo } from './api.js';
import { renderTeams, renderTodos, renderEditAssigneeCheckboxes } from './render.js';
import { API_BASE_URL } from './config.js';

export function selectTeam(teamId) {
  updateState('currentTeamId', teamId);
  
  if (teamId === null) {
    elements.teamNameHeader.textContent = '個人任務';
    updateState('teamMembers', []);
  } else {
    const team = state.teams.find(t => t.id === teamId);
    elements.teamNameHeader.textContent = team ? team.name : '團隊';
    loadTeamMembersForAssignment(teamId);
  }
  
  renderTeams();
  loadTodos();
  closeDetailPanel();
  showTodoListView();
  closeSidebarOnMobile();
}

export function showTeamSettings(teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return;
  
  document.getElementById('managementTeamName').textContent = team.name;
  document.getElementById('editTeamNameInput').value = team.name;
  document.getElementById('editTeamColorInput').value = team.color;
  document.getElementById('teamCreatedAt').textContent = new Date(team.created_at).toLocaleString('zh-TW');
  
  const isOwner = team.role === 'owner';
  const deleteTeamBtn = document.getElementById('deleteTeamBtn');
  const addMemberBtnEl = document.getElementById('addMemberBtn');
  const dangerZone = document.querySelector('.danger-zone');
  const editTeamNameBtn = document.getElementById('editTeamNameBtn');
  const editTeamColorBtn = document.getElementById('editTeamColorBtn');
  const editTeamNameInput = document.getElementById('editTeamNameInput');
  const editTeamColorInput = document.getElementById('editTeamColorInput');
  
  if (deleteTeamBtn) {
    deleteTeamBtn.style.display = isOwner ? 'flex' : 'none';
  }
  if (addMemberBtnEl) {
    addMemberBtnEl.style.display = isOwner ? 'flex' : 'none';
  }
  if (dangerZone) {
    dangerZone.style.display = isOwner ? 'flex' : 'none';
  }
  if (editTeamNameBtn) {
    editTeamNameBtn.style.display = isOwner ? 'inline-flex' : 'none';
  }
  if (editTeamColorBtn) {
    editTeamColorBtn.style.display = isOwner ? 'inline-flex' : 'none';
  }
  if (editTeamNameInput) {
    editTeamNameInput.disabled = !isOwner;
  }
  if (editTeamColorInput) {
    editTeamColorInput.disabled = !isOwner;
  }
  
  loadTeamMembers(teamId);
  
  document.getElementById('todoListView').style.display = 'none';
  document.getElementById('calendarView').style.display = 'none';
  document.getElementById('teamManagementView').style.display = 'block';
  elements.userProfileView.style.display = 'none';
  
  updateState('currentTeamId', teamId);
  renderTeams();
  closeDetailPanel();
}

export function showTodoListView() {
  updateState('currentView', 'list');
  document.getElementById('todoListView').style.display = 'flex';
  document.getElementById('teamManagementView').style.display = 'none';
  document.getElementById('calendarView').style.display = 'none';
  elements.userProfileView.style.display = 'none';
}

export function showTodoDetail(id) {
  updateState('selectedTodoId', id);
  const todo = state.todos.find(t => t.id === id);
  
  if (!todo) return;
  
  elements.detailTitle.textContent = todo.title;
  elements.detailDescription.textContent = todo.content || '無內容描述';
  
  const detailStartDateEl = document.getElementById('detailStartDate');
  const detailDueDateEl = document.getElementById('detailDueDate');
  
  detailStartDateEl.textContent = todo.start_date ? new Date(todo.start_date).toLocaleString('zh-TW') : '未設定';
  detailDueDateEl.textContent = todo.due_date ? new Date(todo.due_date).toLocaleString('zh-TW') : '未設定';
  
  elements.detailPriority.textContent = todo.priority === 'high' ? '🔴 高優先' : 
                                todo.priority === 'medium' ? '🟡 中優先' : 
                                '🟢 低優先';
  elements.detailPriority.className = `priority-badge priority-${todo.priority}`;
  elements.detailCreatedAt.textContent = new Date(todo.created_at).toLocaleString('zh-TW');
  
  if (todo.assignees && todo.assignees.length > 0) {
    elements.detailAssigneesField.style.display = 'block';
    elements.detailAssignees.innerHTML = todo.assignees.map(assignee => `
      <span class="assignee-tag">
        <div class="assignee-avatar-tiny">${assignee.username.charAt(0).toUpperCase()}</div>
        ${escapeHtml(assignee.username)}
      </span>
    `).join('');
  } else {
    elements.detailAssigneesField.style.display = 'none';
  }
  
  // 團隊待辦都要顯示建立者
  if (state.currentTeamId !== null && todo.creator_name) {
    elements.detailCreatorField.style.display = 'block';
    elements.detailCreator.innerHTML = `
      <span class="creator-tag">
        <div class="creator-avatar">${todo.creator_name.charAt(0).toUpperCase()}</div>
        <span class="creator-name">${escapeHtml(todo.creator_name)}</span>
      </span>
    `;
  } else {
    elements.detailCreatorField.style.display = 'none';
  }
  
  elements.detailPlaceholder.style.display = 'none';
  elements.detailContent.style.display = 'flex';
  
  if (window.innerWidth <= 968) {
    elements.rightSidebar.classList.add('show');
  }
  
  renderTodos();
}

export function closeDetailPanel() {
  updateState('selectedTodoId', null);
  elements.detailPlaceholder.style.display = 'flex';
  elements.detailContent.style.display = 'none';
  
  if (window.innerWidth <= 968) {
    elements.rightSidebar.classList.remove('show');
  }
  
  renderTodos();
}

export async function editTodoFromDetail() {
  if (!state.selectedTodoId) return;
  
  const todo = state.todos.find(t => t.id === state.selectedTodoId);
  if (!todo) return;
  
  elements.editTodoTitle.value = todo.title;
  elements.editTodoContent.value = todo.content || '';
  elements.editTodoPriority.value = todo.priority;
  elements.editTodoStartDate.value = todo.start_date ? todo.start_date.slice(0, 16) : '';
  elements.editTodoDueDate.value = todo.due_date ? todo.due_date.slice(0, 16) : '';
  elements.editCharCount.textContent = todo.content ? todo.content.length : 0;
  
  if (state.currentTeamId !== null) {
    if (!state.teamMembers || state.teamMembers.length === 0) {
      await loadTeamMembersForAssignment(state.currentTeamId);
    }
    const assignedUserIds = todo.assignees ? todo.assignees.map(a => a.user_id) : [];
    renderEditAssigneeCheckboxes(assignedUserIds);
  } else {
    elements.editAssigneeGroup.style.display = 'none';
  }
  
  elements.detailPlaceholder.style.display = 'flex';
  elements.detailContent.style.display = 'none';
  if (window.innerWidth <= 968) {
    elements.rightSidebar.classList.remove('show');
  }
  
  elements.editTodoModal.classList.add('show');
  elements.editTodoTitle.focus();
}

export function deleteTodoFromDetail() {
  if (!state.selectedTodoId) return;
  deleteTodo(state.selectedTodoId);
}

export function closeTodoModal() {
  elements.todoModal.classList.remove('show');
  elements.addTodoForm.reset();
  elements.charCount.textContent = '0';
  elements.assigneeGroup.style.display = 'none';
}

export function closeTeamModal() {
  elements.teamModal.classList.remove('show');
  elements.addTeamForm.reset();
}

export function closeEditTodoModal() {
  elements.editTodoModal.classList.remove('show');
  elements.editTodoForm.reset();
  elements.editCharCount.textContent = '0';
  elements.editAssigneeGroup.style.display = 'none';
}

export function closeAddMemberModal() {
  elements.addMemberModal.classList.remove('show');
  elements.addMemberForm.reset();
}

export async function showUserProfile() {
  updateState('currentView', 'profile');
  
  // 隱藏其他視圖
  elements.todoListView.style.display = 'none';
  elements.calendarView.style.display = 'none';
  document.getElementById('teamManagementView').style.display = 'none';
  
  // 顯示個人資料視圖
  elements.userProfileView.style.display = 'flex';
  closeDetailPanel();
  
  // 獲取使用者資訊
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      elements.profileUsername.textContent = user.username;
      elements.profileEmail.textContent = user.email;
      elements.profileCreatedAt.textContent = new Date(user.created_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // 計算統計資訊
      const personalTodos = state.todos.filter(t => t.team_id === null);
      const completedTodos = state.todos.filter(t => t.completed);
      
      elements.profilePersonalTodos.textContent = `${personalTodos.length} 個`;
      elements.profileTeamCount.textContent = `${state.teams.length} 個`;
      elements.profileCompletedTodos.textContent = `${completedTodos.length} 個`;
    }
  } catch (error) {
    console.error('獲取使用者資訊錯誤:', error);
  }
}

export function closeUserProfile() {
  updateState('currentView', 'list');
  elements.userProfileView.style.display = 'none';
  elements.todoListView.style.display = 'flex';
}
