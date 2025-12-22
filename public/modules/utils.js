// 工具函數
import { elements } from './dom.js';

export function getToken() {
  return localStorage.getItem('authToken');
}

export function removeToken() {
  localStorage.removeItem('authToken');
}

export function showMessage(message, type = 'success') {
  elements.messageDiv.textContent = message;
  elements.messageDiv.className = `message ${type} show`;
  
  setTimeout(() => {
    elements.messageDiv.classList.remove('show');
  }, 3000);
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function closeSidebarOnMobile() {
  if (window.innerWidth <= 968) {
    elements.leftSidebar.classList.remove('show');
    elements.overlay.classList.remove('show');
  }
}
