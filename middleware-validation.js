const { 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  errorResponse,
  validateEmail,
  validateUsername,
  sanitizeString
} = require('./utils/response-helpers');

/**
 * 驗證並清理請求體中的字串欄位
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

/**
 * 驗證待辦事項輸入
 */
const validateTodoInput = (req, res, next) => {
  const { title } = req.body;
  
  // 標題必填且不能為空
  if (!title || title.trim() === '') {
    return errorResponse(res, '標題不能為空', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 標題長度限制
  if (title.length > 200) {
    return errorResponse(res, '標題長度不能超過 200 個字元', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 內容長度限制
  if (req.body.content && req.body.content.length > 2000) {
    return errorResponse(res, '內容長度不能超過 2000 個字元', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 優先級驗證
  if (req.body.priority && !['low', 'medium', 'high'].includes(req.body.priority)) {
    return errorResponse(res, '無效的優先級', HTTP_STATUS.BAD_REQUEST);
  }
  
  next();
};

/**
 * 驗證團隊輸入
 */
const validateTeamInput = (req, res, next) => {
  const { name } = req.body;
  
  // 團隊名稱必填
  if (!name || name.trim() === '') {
    return errorResponse(res, '團隊名稱不能為空', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 團隊名稱長度限制
  if (name.length > 50) {
    return errorResponse(res, '團隊名稱長度不能超過 50 個字元', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 描述長度限制
  if (req.body.description && req.body.description.length > 500) {
    return errorResponse(res, '描述長度不能超過 500 個字元', HTTP_STATUS.BAD_REQUEST);
  }
  
  // 顏色格式驗證
  if (req.body.color && !/^#[0-9A-Fa-f]{6}$/.test(req.body.color)) {
    return errorResponse(res, '無效的顏色格式', HTTP_STATUS.BAD_REQUEST);
  }
  
  next();
};

/**
 * 驗證 ID 參數
 */
const validateIdParam = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, '無效的 ID', HTTP_STATUS.BAD_REQUEST);
  }
  
  next();
};

/**
 * 驗證電子郵件輸入
 */
const validateEmailInput = (req, res, next) => {
  const { email } = req.body;
  
  if (email && !validateEmail(email)) {
    return errorResponse(res, ERROR_MESSAGES.INVALID_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }
  
  next();
};

module.exports = {
  sanitizeRequestBody,
  validateTodoInput,
  validateTeamInput,
  validateIdParam,
  validateEmailInput
};
