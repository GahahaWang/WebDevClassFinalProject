const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware');
const { dbGet, dbRun } = require('./utils/db-helpers');
const { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  successResponse, 
  errorResponse,
  validateRequiredFields,
  sanitizeString,
  validatePassword,
  validateEmail,
  validateUsername
} = require('./utils/response-helpers');

const router = express.Router();

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

/**
 * 生成 JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 註冊路由
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // 驗證輸入
  if (!validateRequiredFields({ username, email, password })) {
    return errorResponse(res, ERROR_MESSAGES.MISSING_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  // 驗證使用者名稱格式
  if (!validateUsername(username)) {
    return errorResponse(res, ERROR_MESSAGES.INVALID_USERNAME, HTTP_STATUS.BAD_REQUEST);
  }

  // 驗證 Email 格式
  if (!validateEmail(email)) {
    return errorResponse(res, ERROR_MESSAGES.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  // 驗證密碼強度
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return errorResponse(res, passwordValidation.message, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    // 檢查使用者是否已存在
    const existingUser = await dbGet(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [sanitizeString(username), sanitizeString(email)]
    );

    if (existingUser) {
      return errorResponse(res, ERROR_MESSAGES.USER_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 插入新使用者
    const result = await dbRun(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [sanitizeString(username), sanitizeString(email), hashedPassword]
    );

    // 產生 JWT token
    const token = generateToken({
      id: result.lastID,
      username: sanitizeString(username),
      email: sanitizeString(email)
    });

    return successResponse(
      res,
      {
        token,
        user: {
          id: result.lastID,
          username: sanitizeString(username),
          email: sanitizeString(email)
        }
      },
      '註冊成功',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('註冊錯誤:', error);
    return errorResponse(res, ERROR_MESSAGES.SERVER_ERROR, HTTP_STATUS.SERVER_ERROR);
  }
});

// 登入路由
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 驗證輸入
  if (!validateRequiredFields({ username, password })) {
    return errorResponse(res, ERROR_MESSAGES.MISSING_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    // 查詢使用者
    const user = await dbGet(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [sanitizeString(username), sanitizeString(username)]
    );

    if (!user) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // 驗證密碼
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // 產生 JWT token
    const token = generateToken(user);

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }, '登入成功');
  } catch (error) {
    console.error('登入錯誤:', error);
    return errorResponse(res, ERROR_MESSAGES.SERVER_ERROR, HTTP_STATUS.SERVER_ERROR);
  }
});

// 獲取使用者資料（需要認證）
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, { user });
  } catch (error) {
    console.error('獲取使用者資料錯誤:', error);
    return errorResponse(res, ERROR_MESSAGES.SERVER_ERROR, HTTP_STATUS.SERVER_ERROR);
  }
});

// 驗證 token
router.get('/verify', authenticateToken, (req, res) => {
  return successResponse(res, { user: req.user }, 'Token 有效');
});

module.exports = router;
