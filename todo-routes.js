const express = require('express');
const authenticateToken = require('./middleware');
const { sanitizeRequestBody, validateTodoInput, validateIdParam } = require('./middleware-validation');
const { dbGet, dbAll, dbRun } = require('./utils/db-helpers');
const { 
  HTTP_STATUS, 
  successResponse, 
  errorResponse,
  validateRequiredFields,
  sanitizeString 
} = require('./utils/response-helpers');

const router = express.Router();

/**
 * 為待辦事項載入指派的成員
 */
const loadAssigneesForTodo = async (todoId) => {
  try {
    const assignees = await dbAll(
      `SELECT u.id as user_id, u.username, u.email 
       FROM todo_assignments ta
       INNER JOIN users u ON ta.user_id = u.id
       WHERE ta.todo_id = ?`,
      [todoId]
    );
    return assignees || [];
  } catch (error) {
    console.error('載入指派成員錯誤:', error);
    return [];
  }
};

/**
 * 批量處理待辦事項的指派成員
 */
const loadAssigneesForTodos = async (todos) => {
  const todosWithAssignees = await Promise.all(
    todos.map(async (todo) => {
      const assignees = await loadAssigneesForTodo(todo.id);
      return { ...todo, assignees };
    })
  );
  return todosWithAssignees;
};

/**
 * 更新待辦事項的指派成員
 */
const updateTodoAssignments = async (todoId, userId, assignees) => {
  // 檢查權限（只有建立者可以修改指派）
  const todo = await dbGet('SELECT user_id FROM todos WHERE id = ?', [todoId]);
  
  if (!todo || todo.user_id !== userId) {
    return false;
  }

  // 刪除所有現有指派
  await dbRun('DELETE FROM todo_assignments WHERE todo_id = ?', [todoId]);

  // 插入新的指派
  if (assignees && assignees.length > 0) {
    await Promise.all(
      assignees.map(assigneeId =>
        dbRun('INSERT INTO todo_assignments (todo_id, user_id) VALUES (?, ?)', [todoId, assigneeId])
      )
    );
  }

  return true;
};

// 取得使用者的所有待辦事項（可選擇團隊篩選）
router.get('/', authenticateToken, async (req, res) => {
  const { team_id } = req.query;
  
  try {
    let query = `
      SELECT DISTINCT t.*, u.username as creator_name, u.email as creator_email 
      FROM todos t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN todo_assignments ta ON t.id = ta.todo_id
      WHERE (t.user_id = ? OR ta.user_id = ?)
    `;
    const params = [req.user.id, req.user.id];
    
    if (team_id) {
      query += ' AND t.team_id = ?';
      params.push(team_id);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const todos = await dbAll(query, params);
    
    // 為每個待辦事項載入指派的成員
    const todosWithAssignees = await loadAssigneesForTodos(todos);

    return successResponse(res, { todos: todosWithAssignees });
  } catch (error) {
    console.error('載入待辦事項錯誤:', error);
    return errorResponse(res);
  }
});

// 新增待辦事項
router.post('/', authenticateToken, sanitizeRequestBody, validateTodoInput, async (req, res) => {
  const { 
    title, 
    content = '', 
    priority = 'medium', 
    team_id = null, 
    start_date = null, 
    due_date = null, 
    assignees = [] 
  } = req.body;

  if (!title || sanitizeString(title) === '') {
    return errorResponse(res, '請輸入待辦事項標題', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const result = await dbRun(
      'INSERT INTO todos (user_id, team_id, title, content, priority, start_date, due_date, completed) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [req.user.id, team_id, sanitizeString(title), sanitizeString(content), priority, start_date, due_date]
    );

    const todoId = result.lastID;

    // 如果有指派成員，新增到 todo_assignments 表
    if (assignees && assignees.length > 0) {
      await Promise.all(
        assignees.map(userId =>
          dbRun('INSERT INTO todo_assignments (todo_id, user_id) VALUES (?, ?)', [todoId, userId])
        )
      );
    }

    return successResponse(
      res,
      {
        todo: {
          id: todoId,
          user_id: req.user.id,
          team_id,
          title: sanitizeString(title),
          content: sanitizeString(content),
          priority,
          start_date,
          due_date,
          completed: 0
        }
      },
      '待辦事項已新增',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    console.error('新增待辦事項錯誤:', error);
    return errorResponse(res, '新增失敗');
  }
});

// 更新待辦事項
router.put('/:id', authenticateToken, validateIdParam, sanitizeRequestBody, validateTodoInput, async (req, res) => {
  const { id } = req.params;
  const { title, content, priority, completed, start_date, due_date, assignees } = req.body;

  try {
    // 檢查使用者是否為建立者或被指派者
    const todo = await dbGet(
      `SELECT t.* FROM todos t
       LEFT JOIN todo_assignments ta ON t.id = ta.todo_id
       WHERE t.id = ? AND (t.user_id = ? OR ta.user_id = ?)
       LIMIT 1`,
      [id, req.user.id, req.user.id]
    );

    if (!todo) {
      return errorResponse(res, '待辦事項不存在或無權限修改', HTTP_STATUS.NOT_FOUND);
    }

    // 建立更新欄位
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(sanitizeString(title));
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(sanitizeString(content));
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }

    // 更新待辦事項基本資訊
    if (updates.length > 0) {
      values.push(id);
      await dbRun(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // 更新指派成員（只有建立者可以修改指派）
    if (assignees !== undefined) {
      const updated = await updateTodoAssignments(id, req.user.id, assignees);
      if (!updated && todo.user_id !== req.user.id) {
        return successResponse(res, {}, '待辦事項已更新（無權限修改指派）');
      }
    }

    return successResponse(res, {}, '待辦事項已更新');
  } catch (error) {
    console.error('更新待辦事項錯誤:', error);
    return errorResponse(res, '更新失敗');
  }
});

// 刪除待辦事項
router.delete('/:id', authenticateToken, validateIdParam, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await dbRun(
      'DELETE FROM todos WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.changes === 0) {
      return errorResponse(res, '待辦事項不存在', HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, {}, '待辦事項已刪除');
  } catch (error) {
    console.error('刪除待辦事項錯誤:', error);
    return errorResponse(res);
  }
});

module.exports = router;
