// 認證相關功能
import { API_BASE_URL } from './config.js';
import { elements } from './dom.js';
import { state, updateState } from './state.js';
import { getToken, removeToken } from './utils.js';

export async function checkAuth() {
  const token = getToken();
  
  if (!token) {
    window.location.href = '/';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      removeToken();
      window.location.href = '/';
    } else {
      elements.headerUsernameEl.textContent = data.user.username;
      updateState('currentUserId', data.user.id);
    }
  } catch (error) {
    console.error('認證錯誤:', error);
    removeToken();
    window.location.href = '/';
  }
}

export function handleLogout() {
  removeToken();
  window.location.href = '/';
}
