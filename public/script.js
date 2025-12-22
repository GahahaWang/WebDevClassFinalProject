const API_BASE_URL = 'http://localhost:3000/api/auth';

// DOM 元素
const elements = {
  container: document.querySelector('.container'),
  signUpBtn: document.getElementById('sign-up-btn'),
  signInBtn: document.getElementById('sign-in-btn'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  messageDiv: document.getElementById('message'),
  profilePage: document.getElementById('profilePage'),
  logoutBtn: document.getElementById('logoutBtn')
};

// ==================== 輔助函數 ====================

/**
 * 顯示訊息
 */
function showMessage(message, type = 'success') {
  elements.messageDiv.textContent = message;
  elements.messageDiv.className = `message ${type} show`;
  
  setTimeout(() => {
    elements.messageDiv.classList.remove('show');
  }, 3000);
}

/**
 * Token 管理
 */
const tokenManager = {
  save: (token) => localStorage.setItem('authToken', token),
  get: () => localStorage.getItem('authToken'),
  remove: () => localStorage.removeItem('authToken')
};

/**
 * 統一的 API 請求處理
 */
async function apiRequest(url, options = {}) {
  const token = tokenManager.get();
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();
    
    return { response, data };
  } catch (error) {
    console.error('API 請求錯誤:', error);
    throw error;
  }
}

/**
 * 驗證輸入欄位
 */
function validateFields(fields) {
  return Object.values(fields).every(field => field && field.trim() !== '');
}

/**
 * 驗證 Email 格式
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== 事件處理 ====================

// 切換到註冊表單
elements.signUpBtn.addEventListener('click', () => {
  elements.container.classList.add('sign-up-mode');
});

// 切換到登入表單
elements.signInBtn.addEventListener('click', () => {
  elements.container.classList.remove('sign-up-mode');
});

// 登入表單提交
elements.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!validateFields({ username, password })) {
    showMessage('請填寫所有欄位', 'error');
    return;
  }

  try {
    const { response, data } = await apiRequest(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (data.success) {
      tokenManager.save(data.token);
      showMessage(data.message, 'success');
      elements.loginForm.reset();
      
      setTimeout(() => {
        window.location.href = '/todo';
      }, 1000);
    } else {
      showMessage(data.message, 'error');
    }
  } catch (error) {
    showMessage('登入失敗，請稍後再試', 'error');
  }
});

// 註冊表單提交
elements.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!validateFields({ username, email, password })) {
    showMessage('請填寫所有欄位', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('密碼長度至少需要 6 個字元', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showMessage('請輸入有效的 Email 地址', 'error');
    return;
  }

  try {
    const { response, data } = await apiRequest(`${API_BASE_URL}/register`, {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    if (data.success) {
      tokenManager.save(data.token);
      showMessage(data.message, 'success');
      elements.registerForm.reset();
      
      setTimeout(() => {
        window.location.href = '/todo';
      }, 1000);
    } else {
      showMessage(data.message, 'error');
    }
  } catch (error) {
    showMessage('註冊失敗，請稍後再試', 'error');
  }
});

// 顯示使用者資訊
async function showProfile() {
  const token = tokenManager.get();
  
  if (!token) {
    showMessage('請先登入', 'error');
    return;
  }

  try {
    const { response, data } = await apiRequest(`${API_BASE_URL}/profile`);

    if (data.success) {
      document.getElementById('profileUsername').textContent = data.user.username;
      document.getElementById('profileEmail').textContent = data.user.email;
      document.getElementById('profileCreatedAt').textContent = formatDateTime(data.user.created_at);
      
      elements.profilePage.classList.add('active');
    } else {
      showMessage(data.message, 'error');
      if (response.status === 401 || response.status === 403) {
        tokenManager.remove();
      }
    }
  } catch (error) {
    showMessage('無法獲取使用者資訊', 'error');
  }
}

// 登出
elements.logoutBtn.addEventListener('click', () => {
  tokenManager.remove();
  elements.profilePage.classList.remove('active');
  elements.container.classList.remove('sign-up-mode');
  elements.loginForm.reset();
  elements.registerForm.reset();
  showMessage('已成功登出', 'success');
});

// 頁面載入時檢查是否已登入
window.addEventListener('load', async () => {
  const token = tokenManager.get();
  
  if (token) {
    try {
      const { data } = await apiRequest(`${API_BASE_URL}/verify`);

      if (data.success) {
        window.location.href = '/todo';
      } else {
        tokenManager.remove();
      }
    } catch (error) {
      console.error('驗證 token 錯誤:', error);
      tokenManager.remove();
    }
  }
});

// 防止社群登入連結的預設行為
document.querySelectorAll('.social-icon').forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.preventDefault();
    showMessage('社群登入功能尚未開放', 'error');
  });
});
