require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const authRoutes = require('./routes');
const todoRoutes = require('./todo-routes');
const teamRoutes = require('./team-routes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS 配置
const corsOptions = {
  // 允許所有來源（不限制 CORS）
  // 若要恢復白名單，改回 (origin, callback) => { ... }
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate Limiting 配置
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分鐘
  max: 5, // 最多 5 次請求
  message: { success: false, message: '請求次數過多，請稍後再試' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 最多 100 次請求
  message: { success: false, message: '請求次數過多，請稍後再試' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 安全性中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));

// 基本中間件
app.use(express.json({ limit: '1mb' })); // 防止 DoS 攻擊
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 請求日誌（開發環境）
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// API 路由（含 Rate Limiting）
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/todos', apiLimiter, todoRoutes);
app.use('/api/teams', apiLimiter, teamRoutes);

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
  console.log(`待辦清單: http://localhost:${PORT}/todo\n`);
});
