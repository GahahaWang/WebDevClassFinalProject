// 事件監聽器設置
import { elements } from './dom.js';
import { state, updateState } from './state.js';
import { handleLogout } from './auth.js';
import { loadTodos, loadTeams, loadTeamMembersForAssignment, toggleTodo, deleteTodo, updateTeam, removeMember } from './api.js';
import { renderTodos, renderAssigneeCheckboxes, renderCalendar } from './render.js';
import { 
  selectTeam, 
  closeDetailPanel, 
  editTodoFromDetail, 
  deleteTodoFromDetail,
  closeTodoModal,
  closeTeamModal,
  closeEditTodoModal,
  closeAddMemberModal,
  showTodoListView,
  showUserProfile,
  closeUserProfile
} from './ui.js';
import { showMessage } from './utils.js';
import { API_BASE_URL } from './config.js';

export function setupEventListeners() {
  // 開啟待辦模態視窗
  elements.openModalBtn.addEventListener('click', async () => {
    if (state.currentTeamId !== null && (!state.teamMembers || state.teamMembers.length === 0)) {
      await loadTeamMembersForAssignment(state.currentTeamId);
    }
    
    elements.todoModal.classList.add('show');
    elements.todoTitle.focus();
    
    if (state.currentTeamId !== null) {
      renderAssigneeCheckboxes();
    } else {
      elements.assigneeGroup.style.display = 'none';
    }
  });

  // 開啟團隊模態視窗
  const openTeamModalBtn = document.getElementById('addTeamBtn');
  openTeamModalBtn.addEventListener('click', () => {
    elements.teamModal.classList.add('show');
    document.getElementById('teamName').focus();
  });

  // 關閉模態視窗
  elements.closeModalBtn.addEventListener('click', closeTodoModal);
  elements.cancelBtn.addEventListener('click', closeTodoModal);
  elements.closeTeamModalBtn.addEventListener('click', closeTeamModal);
  elements.cancelTeamBtn.addEventListener('click', closeTeamModal);
  elements.closeEditModalBtn.addEventListener('click', closeEditTodoModal);
  elements.cancelEditBtn.addEventListener('click', closeEditTodoModal);
  elements.closeDetailBtn.addEventListener('click', closeDetailPanel);
  elements.closeAddMemberModalBtn.addEventListener('click', closeAddMemberModal);
  elements.cancelAddMemberBtn.addEventListener('click', closeAddMemberModal);

  // 新增成員按鈕
  elements.addMemberBtn.addEventListener('click', () => {
    elements.addMemberModal.classList.add('show');
    elements.memberEmail.value = '';
    elements.memberEmail.focus();
  });

  // 詳情面板按鈕
  elements.detailEditBtn.addEventListener('click', editTodoFromDetail);
  elements.detailDeleteBtn.addEventListener('click', deleteTodoFromDetail);
  
  // 個人資料
  elements.headerUsername.addEventListener('click', showUserProfile);
  elements.backFromProfileBtn.addEventListener('click', closeUserProfile);

  // 點擊模態視窗外部關閉
  elements.todoModal.addEventListener('click', (e) => {
    if (e.target === elements.todoModal) {
      closeTodoModal();
    }
  });

  elements.teamModal.addEventListener('click', (e) => {
    if (e.target === elements.teamModal) {
      closeTeamModal();
    }
  });

  elements.editTodoModal.addEventListener('click', (e) => {
    if (e.target === elements.editTodoModal) {
      closeEditTodoModal();
    }
  });

  // ESC 鍵關閉模態視窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.todoModal.classList.contains('show')) {
        closeTodoModal();
      }
      if (elements.teamModal.classList.contains('show')) {
        closeTeamModal();
      }
      if (elements.editTodoModal.classList.contains('show')) {
        closeEditTodoModal();
      }
      if (window.innerWidth <= 968 && elements.rightSidebar.classList.contains('show')) {
        closeDetailPanel();
      }
    }
  });

  // 字數統計
  elements.todoContent.addEventListener('input', () => {
    elements.charCount.textContent = elements.todoContent.value.length;
  });

  elements.editTodoContent.addEventListener('input', () => {
    elements.editCharCount.textContent = elements.editTodoContent.value.length;
  });

  // 顏色選擇器預覽
  elements.teamColorInput.addEventListener('input', (e) => {
    elements.teamColorPreview.textContent = e.target.value;
  });

  // 新增團隊成員
  elements.addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = elements.memberEmail.value.trim();
    
    if (!email) {
      showMessage('請輸入電子郵件', 'error');
      return;
    }
    
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${state.currentTeamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showMessage('成員已新增', 'success');
        closeAddMemberModal();
        const { loadTeamMembers } = await import('./api.js');
        loadTeamMembers(state.currentTeamId);
        loadTeams();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('新增成員錯誤:', error);
      showMessage('新增成員失敗', 'error');
    }
  });

  // 新增待辦事項
  elements.addTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = elements.todoTitle.value.trim();
    const content = elements.todoContent.value.trim();
    const priority = elements.todoPriority.value;
    const start_date = elements.todoStartDate.value || null;
    const due_date = elements.todoDueDate.value || null;

    if (!title) {
      showMessage('請輸入標題', 'error');
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      const todoData = { 
        title, 
        content, 
        priority,
        start_date,
        due_date
      };
      
      if (state.currentTeamId !== null) {
        todoData.team_id = state.currentTeamId;
        
        const selectedAssignees = Array.from(
          document.querySelectorAll('input[name="assignees"]:checked')
        ).map(checkbox => parseInt(checkbox.value));
        
        if (selectedAssignees.length > 0) {
          todoData.assignees = selectedAssignees;
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(todoData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('待辦事項已新增', 'success');
        closeTodoModal();
        loadTodos();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('新增待辦事項錯誤:', error);
      showMessage('新增失敗', 'error');
    }
  });

  // 新增團隊
  elements.addTeamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('teamName').value.trim();
    const color = elements.teamColorInput.value;

    if (!name) {
      showMessage('請輸入團隊名稱', 'error');
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, color })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('團隊已建立', 'success');
        closeTeamModal();
        loadTeams();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('建立團隊錯誤:', error);
      showMessage('建立失敗', 'error');
    }
  });

  // 編輯待辦事項
  elements.editTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!state.selectedTodoId) return;
    
    const title = elements.editTodoTitle.value.trim();
    const content = elements.editTodoContent.value.trim();
    const priority = elements.editTodoPriority.value;
    const start_date = elements.editTodoStartDate.value || null;
    const due_date = elements.editTodoDueDate.value || null;

    if (!title) {
      showMessage('請輸入標題', 'error');
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      const updateData = { 
        title,
        content,
        priority,
        start_date,
        due_date
      };
      
      if (state.currentTeamId !== null) {
        const selectedAssignees = Array.from(
          document.querySelectorAll('input[name="editAssignees"]:checked')
        ).map(checkbox => parseInt(checkbox.value));
        
        updateData.assignees = selectedAssignees;
      }
      
      const response = await fetch(`${API_BASE_URL}/todos/${state.selectedTodoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('待辦事項已更新', 'success');
        closeEditTodoModal();
        loadTodos();
        updateState('selectedTodoId', null);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('更新待辦事項錯誤:', error);
      showMessage('更新失敗', 'error');
    }
  });

  // 篩選事件
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateState('currentFilter', btn.dataset.filter);
      renderTodos();
    });
  });

  // 登出
  elements.logoutBtn.addEventListener('click', handleLogout);

  // RWD - 切換團隊列表
  if (elements.toggleTeamsBtn) {
    elements.toggleTeamsBtn.addEventListener('click', () => {
      elements.leftSidebar.classList.toggle('show');
      elements.overlay.classList.toggle('show');
    });
  }

  // 點擊遮罩層關閉側邊欄
  if (elements.overlay) {
    elements.overlay.addEventListener('click', () => {
      elements.leftSidebar.classList.remove('show');
      elements.rightSidebar.classList.remove('show');
      elements.overlay.classList.remove('show');
    });
  }

  // 視圖切換功能
  if (elements.toggleCalendarBtn) {
    elements.toggleCalendarBtn.addEventListener('click', () => {
      switchToCalendarView();
    });
  }

  if (elements.toggleListBtn) {
    elements.toggleListBtn.addEventListener('click', () => {
      switchToListView();
    });
  }

  // 月曆視圖的新增按鈕
  if (elements.openModalBtnCalendar) {
    elements.openModalBtnCalendar.addEventListener('click', async () => {
      elements.addTodoForm.reset();
      elements.charCount.textContent = '0';
      
      elements.todoModal.classList.add('show');
      elements.todoTitle.focus();
      
      if (state.currentTeamId !== null) {
        await loadTeamMembersForAssignment(state.currentTeamId);
        renderAssigneeCheckboxes();
      } else {
        elements.assigneeGroup.style.display = 'none';
      }
    });
  }

  // 月曆導航
  if (elements.prevMonthBtn) {
    elements.prevMonthBtn.addEventListener('click', () => {
      updateState('currentCalendarMonth', state.currentCalendarMonth - 1);
      if (state.currentCalendarMonth < 0) {
        updateState('currentCalendarMonth', 11);
        updateState('currentCalendarYear', state.currentCalendarYear - 1);
      }
      renderCalendar();
    });
  }

  if (elements.nextMonthBtn) {
    elements.nextMonthBtn.addEventListener('click', () => {
      updateState('currentCalendarMonth', state.currentCalendarMonth + 1);
      if (state.currentCalendarMonth > 11) {
        updateState('currentCalendarMonth', 0);
        updateState('currentCalendarYear', state.currentCalendarYear + 1);
      }
      renderCalendar();
    });
  }

  // 返回待辦清單
  document.getElementById('backToTodoBtn').addEventListener('click', () => {
    showTodoListView();
    if (state.currentTeamId !== null) {
      selectTeam(state.currentTeamId);
    }
  });

  // 編輯團隊名稱
  let isEditingTeamName = false;
  document.getElementById('editTeamNameBtn').addEventListener('click', async () => {
    const input = document.getElementById('editTeamNameInput');
    
    if (!isEditingTeamName) {
      input.disabled = false;
      input.focus();
      input.select();
      isEditingTeamName = true;
    } else {
      const newName = input.value.trim();
      if (!newName) {
        showMessage('團隊名稱不能為空', 'error');
        return;
      }
      
      await updateTeam(state.currentTeamId, { name: newName });
      input.disabled = true;
      isEditingTeamName = false;
    }
  });

  // 編輯團隊顏色
  let isEditingTeamColor = false;
  document.getElementById('editTeamColorBtn').addEventListener('click', async () => {
    const input = document.getElementById('editTeamColorInput');
    
    if (!isEditingTeamColor) {
      input.disabled = false;
      input.click();
      isEditingTeamColor = true;
    } else {
      await updateTeam(state.currentTeamId, { color: input.value });
      input.disabled = true;
      isEditingTeamColor = false;
    }
  });

  document.getElementById('editTeamColorInput').addEventListener('change', async (e) => {
    if (isEditingTeamColor) {
      await updateTeam(state.currentTeamId, { color: e.target.value });
      document.getElementById('editTeamColorInput').disabled = true;
      isEditingTeamColor = false;
    }
  });

  // 刪除團隊
  document.getElementById('deleteTeamBtn').addEventListener('click', async () => {
    if (!confirm('確定要刪除此團隊嗎？這將同時刪除團隊內的所有待辦事項,且無法復原!')) {
      return;
    }
    
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${state.currentTeamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        showMessage('團隊已刪除', 'success');
        await loadTeams();
        selectTeam(null);
        showTodoListView();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('刪除團隊錯誤:', error);
      showMessage('刪除失敗', 'error');
    }
  });
}

// 視圖切換函數
export function switchToCalendarView() {
  updateState('currentView', 'calendar');
  elements.todoListView.style.display = 'none';
  elements.calendarView.style.display = 'flex';
  closeDetailPanel();
  renderCalendar();
}

export function switchToListView() {
  updateState('currentView', 'list');
  elements.calendarView.style.display = 'none';
  elements.todoListView.style.display = 'flex';
}

// 暴露全局函數供HTML onclick使用
window.selectTeam = selectTeam;
window.showTodoDetail = (id) => {
  const { showTodoDetail } = require('./ui.js');
  showTodoDetail(id);
};
window.toggleTodo = toggleTodo;
window.removeMember = removeMember;
window.showTeamSettings = (teamId) => {
  const { showTeamSettings } = require('./ui.js');
  showTeamSettings(teamId);
};
