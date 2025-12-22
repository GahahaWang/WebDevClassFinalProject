// 渲染函數
import { state, updateState } from './state.js';
import { elements } from './dom.js';
import { escapeHtml } from './utils.js';

export function renderTeams() {
  const teamsHtml = state.teams.map(team => `
    <div class="team-item ${state.currentTeamId === team.id ? 'active' : ''}">
      <div class="team-color" style="background: ${team.color};" onclick="window.selectTeam(${team.id})"></div>
      <div class="team-info" onclick="window.selectTeam(${team.id})">
        <h3>${escapeHtml(team.name)}</h3>
        <p>${team.member_count || 1} 位成員</p>
      </div>
      <button class="team-settings-btn" onclick="event.stopPropagation(); window.showTeamSettings(${team.id})" title="團隊設定">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
        </svg>
      </button>
    </div>
  `).join('');
  
  const personalItem = `
    <div class="team-item ${state.currentTeamId === null ? 'active' : ''}" onclick="window.selectTeam(null)">
      <div class="team-color" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
      <div class="team-info">
        <h3>個人任務</h3>
        <p>僅限自己</p>
      </div>
    </div>
  `;
  
  elements.teamsList.innerHTML = personalItem + teamsHtml;
}

export function renderTodos() {
  let filteredTodos = state.todos;

  if (state.currentFilter === 'pending') {
    filteredTodos = state.todos.filter(todo => !todo.completed);
  } else if (state.currentFilter === 'completed') {
    filteredTodos = state.todos.filter(todo => todo.completed);
  }

  if (filteredTodos.length === 0) {
    elements.todosList.innerHTML = '';
    elements.emptyState.classList.add('show');
  } else {
    elements.emptyState.classList.remove('show');
    elements.todosList.innerHTML = filteredTodos.map(todo => `
      <div class="todo-item ${todo.completed ? 'completed' : ''} ${state.selectedTodoId === todo.id ? 'selected' : ''} priority-${todo.priority}" onclick="window.showTodoDetail(${todo.id})">
        <input 
          type="checkbox" 
          class="todo-checkbox" 
          ${todo.completed ? 'checked' : ''}
          onclick="event.stopPropagation();"
          onchange="window.toggleTodo(${todo.id})"
        >
        <div class="todo-content">
          <div class="todo-text">
            ${escapeHtml(todo.title)}
            ${state.currentTeamId !== null && todo.user_id !== state.currentUserId ? '<span class="assigned-badge">📌 指派給我</span>' : ''}
          </div>
          <div class="todo-meta">
            <span class="priority-badge priority-${todo.priority}">
              ${todo.priority === 'high' ? '🔴 高優先' : todo.priority === 'medium' ? '🟡 中優先' : '🟢 低優先'}
            </span>
            ${todo.due_date ? `<span>📅 ${new Date(todo.due_date).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>` : ''}
            ${!todo.due_date ? `<span>${new Date(todo.created_at).toLocaleDateString('zh-TW')}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

export function renderTeamMembers() {
  if (!state.teamMembers || state.teamMembers.length === 0) {
    elements.membersList.innerHTML = `
      <div class="empty-members">
        <p>目前沒有其他成員</p>
      </div>
    `;
    return;
  }
  
  elements.membersList.innerHTML = state.teamMembers.map(member => `
    <div class="member-item">
      <div class="member-avatar">
        ${member.username.charAt(0).toUpperCase()}
      </div>
      <div class="member-info">
        <h4>${escapeHtml(member.username)}</h4>
        <p>${escapeHtml(member.email)}</p>
      </div>
      <span class="member-role ${member.role === 'owner' ? 'role-owner' : 'role-member'}">
        ${member.role === 'owner' ? '👑 擁有者' : '👤 成員'}
      </span>
      ${member.role !== 'owner' ? `
        <button class="remove-member-btn" onclick="window.removeMember(${member.user_id})" title="移除成員">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ` : ''}
    </div>
  `).join('');
}

export function renderAssigneeCheckboxes() {
  if (state.currentTeamId === null) {
    elements.assigneeGroup.style.display = 'none';
    elements.editAssigneeGroup.style.display = 'none';
    return;
  }
  
  elements.assigneeGroup.style.display = 'block';
  
  if (!state.teamMembers || state.teamMembers.length === 0) {
    elements.assigneeList.innerHTML = '<p class="form-hint">此團隊目前沒有其他成員</p>';
    return;
  }
  
  elements.assigneeList.innerHTML = state.teamMembers.map(member => `
    <label class="assignee-checkbox-item">
      <input type="checkbox" name="assignees" value="${member.user_id}">
      <div class="assignee-avatar-small">${member.username.charAt(0).toUpperCase()}</div>
      <span class="assignee-label">${escapeHtml(member.username)}</span>
    </label>
  `).join('');
}

export function renderEditAssigneeCheckboxes(assignedUserIds = []) {
  if (state.currentTeamId === null) {
    elements.editAssigneeGroup.style.display = 'none';
    return;
  }
  
  elements.editAssigneeGroup.style.display = 'block';
  
  if (!state.teamMembers || state.teamMembers.length === 0) {
    elements.editAssigneeList.innerHTML = '<p class="form-hint">此團隊目前沒有其他成員</p>';
    return;
  }
  
  elements.editAssigneeList.innerHTML = state.teamMembers.map(member => `
    <label class="assignee-checkbox-item">
      <input type="checkbox" name="editAssignees" value="${member.user_id}" 
        ${assignedUserIds.includes(member.user_id) ? 'checked' : ''}>
      <div class="assignee-avatar-small">${member.username.charAt(0).toUpperCase()}</div>
      <span class="assignee-label">${escapeHtml(member.username)}</span>
    </label>
  `).join('');
}

export function renderCalendar() {
  const firstDay = new Date(state.currentCalendarYear, state.currentCalendarMonth, 1);
  const lastDay = new Date(state.currentCalendarYear, state.currentCalendarMonth + 1, 0);
  const prevLastDay = new Date(state.currentCalendarYear, state.currentCalendarMonth, 0);
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();
  const nextDays = 6 - lastDayIndex;
  
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  elements.currentMonthEl.textContent = `${state.currentCalendarYear}年${monthNames[state.currentCalendarMonth]}`;
  
  let calendarHTML = '';
  
  const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  dayHeaders.forEach(day => {
    calendarHTML += `<div class="calendar-day-header">${day}</div>`;
  });
  
  for (let x = firstDayIndex; x > 0; x--) {
    const dayNum = prevLastDay.getDate() - x + 1;
    calendarHTML += `<div class="calendar-day other-month">
      <div class="day-number">${dayNum}</div>
    </div>`;
  }
  
  const today = new Date();
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${state.currentCalendarYear}-${String(state.currentCalendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const isToday = today.getDate() === i && 
                    today.getMonth() === state.currentCalendarMonth && 
                    today.getFullYear() === state.currentCalendarYear;
    
    // 找出這一天的待辦事項 - 包含跨天顯示
    const dayTodos = state.allTodos.filter(todo => {
      const startDate = todo.start_date ? todo.start_date.split('T')[0] : null;
      const dueDate = todo.due_date ? todo.due_date.split('T')[0] : null;
      
      // 如果有開始和截止日期，檢查當前日期是否在範圍內
      if (startDate && dueDate) {
        return dateStr >= startDate && dateStr <= dueDate;
      }
      // 只有開始日期
      if (startDate && !dueDate) {
        return dateStr === startDate;
      }
      // 只有截止日期
      if (!startDate && dueDate) {
        return dateStr === dueDate;
      }
      return false;
    });
    
    let todosHTML = '';
    const maxShow = 4;
    const displayTodos = dayTodos.slice(0, maxShow);
    
    displayTodos.forEach(todo => {
      const priorityClass = `priority-${todo.priority}`;
      const completedClass = todo.completed ? 'completed' : '';
      const startDate = todo.start_date ? todo.start_date.split('T')[0] : null;
      const dueDate = todo.due_date ? todo.due_date.split('T')[0] : null;
      
      let prefix = '';
      if (startDate && dueDate) {
        if (startDate === dateStr && dueDate === dateStr) {
          prefix = '⏱️ ';
        } else if (startDate === dateStr) {
          prefix = '▶️ ';
        } else if (dueDate === dateStr) {
          prefix = '🏁 ';
        } else {
          prefix = '━ ';
        }
      } else if (startDate === dateStr) {
        prefix = '▶️ ';
      } else if (dueDate === dateStr) {
        prefix = '🏁 ';
      }
      
      todosHTML += `<div class="calendar-todo-item ${priorityClass} ${completedClass}" 
                         onclick="event.stopPropagation(); window.showTodoDetail(${todo.id})" 
                         title="${escapeHtml(todo.title)}">
        ${prefix}${escapeHtml(todo.title)}
      </div>`;
    });
    
    const moreCount = dayTodos.length > maxShow ? dayTodos.length - maxShow : 0;
    const todayClass = isToday ? 'today' : '';
    
    calendarHTML += `<div class="calendar-day ${todayClass}">
      <div class="day-number">${i}</div>
      <div class="calendar-todos">${todosHTML}</div>
      ${moreCount > 0 ? `<div class="calendar-todo-count">+${moreCount}</div>` : ''}
    </div>`;
  }
  
  for (let j = 1; j <= nextDays; j++) {
    calendarHTML += `<div class="calendar-day other-month">
      <div class="day-number">${j}</div>
    </div>`;
  }
  
  elements.calendarGrid.innerHTML = calendarHTML;
}
