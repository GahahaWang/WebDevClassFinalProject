require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes');
const todoRoutes = require('./todo-routes');
const teamRoutes = require('./team-routes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS 配置 - 完全開放
app.use(cors());

// 明確禁用所有 CSP 和安全頭
app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Security-Policy');
  res.removeHeader('X-WebKit-CSP');
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});

// 基本中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌（開發環境）
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// API 路由 - 移除 Rate Limiting
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/teams', teamRoutes);

// 首頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 待辦清單頁面路由
app.get('/todo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'todo.html'));
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '找不到請求的資源' });
});

// 全局錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err);
  res.status(err.status || 500).json({
    success: false,
    message: NODE_ENV === 'production' ? '伺服器錯誤' : err.message
  });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`\n伺服器運行在 http://localhost:${PORT}`);
  console.log(`環境: ${NODE_ENV}`);
  console.log(`登入/註冊: http://localhost:${PORT}`);
  console.log(`待辦清單: http://localhost:${PORT}/todo`);
  console.log(`Demo 演示: http://localhost:${PORT}/demo (無需登入)\n`);
});
