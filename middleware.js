const jwt = require('jsonwebtoken');

// 錯誤訊息常量
const ERROR_MESSAGES = {
  NO_TOKEN: '未提供認證 token',
  INVALID_TOKEN: 'Token 無效或已過期',
  UNAUTHORIZED: '未經授權的訪問'
};

// HTTP STATUS
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403
};

/**
 * JWT 認證中間件
 * 驗證請求中的 Bearer token 並將使用者資訊附加到 req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      success: false, 
      message: ERROR_MESSAGES.NO_TOKEN
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ 
        success: false, 
        message: ERROR_MESSAGES.INVALID_TOKEN
      });
    }
    
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
