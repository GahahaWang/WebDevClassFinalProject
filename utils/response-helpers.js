// HTTP 狀態碼
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// 常用錯誤訊息
const ERROR_MESSAGES = {
  MISSING_FIELDS: '請填寫所有欄位',
  INVALID_CREDENTIALS: '使用者名稱或密碼錯誤',
  USER_EXISTS: '使用者名稱或 Email 已被使用',
  USER_NOT_FOUND: '使用者不存在',
  PASSWORD_TOO_SHORT: '密碼長度至少需要 8 個字元',
  PASSWORD_TOO_WEAK: '密碼必須包含大寫、小寫、數字和特殊字元',
  INVALID_EMAIL: 'Email 格式不正確',
  INVALID_USERNAME: '使用者名稱僅能包含英數字、底線和連字號',
  SERVER_ERROR: '伺服器錯誤',
  UNAUTHORIZED: '未經授權的訪問'
};

/**
 * 成功響應
 */
const successResponse = (res, data = {}, message = '操作成功', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * 錯誤響應
 */
const errorResponse = (res, message = ERROR_MESSAGES.SERVER_ERROR, statusCode = HTTP_STATUS.SERVER_ERROR) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

/**
 * 驗證必填欄位
 */
const validateRequiredFields = (fields) => {
  return Object.values(fields).every(field => 
    field !== undefined && field !== null && field !== ''
  );
};

/**
 * 清理輸入字串
 */
const sanitizeString = (str) => {
  return typeof str === 'string' ? str.trim() : str;
};

/**
 * 驗證密碼強度
 * - 至少 8 個字元
 * - 包含大寫字母
 * - 包含小寫字母
 * - 包含數字
 * - 包含特殊字元
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return { valid: false, message: ERROR_MESSAGES.PASSWORD_TOO_WEAK };
  }
  
  return { valid: true };
};

/**
 * 驗證 Email 格式
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 驗證使用者名稱
 * - 僅允許英數字、底線和連字號
 * - 3-20 個字元
 */
const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  successResponse,
  errorResponse,
  validateRequiredFields,
  sanitizeString,
  validatePassword,
  validateEmail,
  validateUsername
};
