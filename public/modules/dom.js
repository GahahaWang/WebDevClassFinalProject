// DOM 元素引用
export const elements = {
  // 待辦清單元素
  todosList: document.getElementById('todosList'),
  addTodoForm: document.getElementById('addTodoForm'),
  todoTitle: document.getElementById('todoTitle'),
  todoContent: document.getElementById('todoContent'),
  todoPriority: document.getElementById('todoPriority'),
  todoStartDate: document.getElementById('todoStartDate'),
  todoDueDate: document.getElementById('todoDueDate'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  emptyState: document.getElementById('emptyState'),
  logoutBtn: document.getElementById('logoutBtn'),
  messageDiv: document.getElementById('message'),

  // RWD 元素
  toggleTeamsBtn: document.getElementById('toggleTeamsBtn'),
  overlay: document.getElementById('overlay'),
  leftSidebar: document.querySelector('.left-sidebar'),
  
  // 個人資料元素
  headerUsername: document.getElementById('headerUsername'),
  userProfileView: document.getElementById('userProfileView'),
  backFromProfileBtn: document.getElementById('backFromProfileBtn'),
  profileUsername: document.getElementById('profileUsername'),
  profileEmail: document.getElementById('profileEmail'),
  profileCreatedAt: document.getElementById('profileCreatedAt'),
  profilePersonalTodos: document.getElementById('profilePersonalTodos'),
  profileTeamCount: document.getElementById('profileTeamCount'),
  profileCompletedTodos: document.getElementById('profileCompletedTodos'),

  // 視圖切換元素
  todoListView: document.getElementById('todoListView'),
  calendarView: document.getElementById('calendarView'),
  toggleCalendarBtn: document.getElementById('toggleCalendarBtn'),
  toggleListBtn: document.getElementById('toggleListBtn'),
  openModalBtnCalendar: document.getElementById('openModalBtnCalendar'),

  // 月曆元素
  calendarGrid: document.getElementById('calendarGrid'),
  currentMonthEl: document.getElementById('currentMonth'),
  prevMonthBtn: document.getElementById('prevMonth'),
  nextMonthBtn: document.getElementById('nextMonth'),

  // 模態視窗元素
  todoModal: document.getElementById('todoModal'),
  teamModal: document.getElementById('teamModal'),
  editTodoModal: document.getElementById('editTodoModal'),
  openModalBtn: document.getElementById('openModalBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  closeTeamModalBtn: document.getElementById('closeTeamModalBtn'),
  closeEditModalBtn: document.getElementById('closeEditModalBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  cancelTeamBtn: document.getElementById('cancelTeamBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  charCount: document.getElementById('charCount'),

  // 成員管理元素
  addMemberModal: document.getElementById('addMemberModal'),
  addMemberBtn: document.getElementById('addMemberBtn'),
  closeAddMemberModalBtn: document.getElementById('closeAddMemberModalBtn'),
  cancelAddMemberBtn: document.getElementById('cancelAddMemberBtn'),
  addMemberForm: document.getElementById('addMemberForm'),
  memberEmail: document.getElementById('memberEmail'),
  membersList: document.getElementById('membersList'),

  // 編輯表單元素
  editTodoForm: document.getElementById('editTodoForm'),
  editTodoTitle: document.getElementById('editTodoTitle'),
  editTodoContent: document.getElementById('editTodoContent'),
  editTodoPriority: document.getElementById('editTodoPriority'),
  editTodoStartDate: document.getElementById('editTodoStartDate'),
  editTodoDueDate: document.getElementById('editTodoDueDate'),
  editCharCount: document.getElementById('editCharCount'),

  // 團隊元素
  teamsList: document.getElementById('teamsList'),
  teamNameHeader: document.getElementById('currentTeamName'),
  addTeamForm: document.getElementById('addTeamForm'),
  teamColorInput: document.getElementById('teamColor'),
  teamColorPreview: document.getElementById('teamColorPreview'),

  // 統計元素
  completedTasksEl: document.getElementById('completedTasks'),
  pendingTasksEl: document.getElementById('pendingTasks'),
  headerUsernameEl: document.getElementById('headerUsername'),

  // 右側詳情面板
  rightSidebar: document.getElementById('rightSidebar'),
  detailPlaceholder: document.getElementById('detailPlaceholder'),
  detailContent: document.getElementById('detailContent'),
  detailTitle: document.getElementById('detailTitle'),
  detailDescription: document.getElementById('detailDescription'),
  detailPriority: document.getElementById('detailPriority'),
  detailCreatedAt: document.getElementById('detailCreatedAt'),
  detailEditBtn: document.getElementById('detailEditBtn'),
  detailDeleteBtn: document.getElementById('detailDeleteBtn'),
  closeDetailBtn: document.getElementById('closeDetailBtn'),

  // 指派成員元素
  assigneeGroup: document.getElementById('assigneeGroup'),
  assigneeList: document.getElementById('assigneeList'),
  editAssigneeGroup: document.getElementById('editAssigneeGroup'),
  editAssigneeList: document.getElementById('editAssigneeList'),
  detailAssigneesField: document.getElementById('detailAssigneesField'),
  detailAssignees: document.getElementById('detailAssignees'),
  detailCreatorField: document.getElementById('detailCreatorField'),
  detailCreator: document.getElementById('detailCreator')
};
