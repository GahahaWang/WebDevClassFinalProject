const express = require('express');
const db = require('./database');
const authenticateToken = require('./middleware');
const { sanitizeRequestBody, validateTeamInput, validateIdParam, validateEmailInput } = require('./middleware-validation');

const router = express.Router();

// 取得使用者的所有團隊
router.get('/', authenticateToken, (req, res) => {
  db.all(
    `SELECT t.*, tm.role, 
     (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
     FROM teams t 
     INNER JOIN team_members tm ON t.id = tm.team_id 
     WHERE tm.user_id = ? 
     ORDER BY t.created_at DESC`,
    [req.user.id],
    (err, teams) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      res.json({
        success: true,
        teams
      });
    }
  );
});

// 新增團隊
router.post('/', authenticateToken, sanitizeRequestBody, validateTeamInput, (req, res) => {
  const { name, description = '', color = '#667eea' } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      message: '請輸入團隊名稱' 
    });
  }

  db.run(
    'INSERT INTO teams (name, description, color, created_by) VALUES (?, ?, ?, ?)',
    [name.trim(), description.trim(), color, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '新增團隊失敗' 
        });
      }

      const teamId = this.lastID;

      // 將建立者加入團隊，角色為 owner
      db.run(
        'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
        [teamId, req.user.id, 'owner'],
        (err) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: '新增團隊成員失敗' 
            });
          }

          res.status(201).json({
            success: true,
            message: '團隊已建立',
            team: {
              id: teamId,
              name: name.trim(),
              description: description.trim(),
              color,
              created_by: req.user.id,
              role: 'owner'
            }
          });
        }
      );
    }
  );
});

// 更新團隊
router.put('/:id', authenticateToken, validateIdParam, sanitizeRequestBody, validateTeamInput, (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  // 檢查是否為團隊成員
  db.get(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [id, req.user.id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      if (!member) {
        return res.status(403).json({ 
          success: false, 
          message: '您不是此團隊成員' 
        });
      }

      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description.trim());
      }

      if (color !== undefined) {
        updates.push('color = ?');
        values.push(color);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '沒有要更新的內容' 
        });
      }

      values.push(id);

      db.run(
        `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: '更新失敗' 
            });
          }

          res.json({
            success: true,
            message: '團隊已更新'
          });
        }
      );
    }
  );
});

// 刪除團隊
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // 檢查是否為團隊擁有者
  db.get(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [id, req.user.id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      if (!member || member.role !== 'owner') {
        return res.status(403).json({ 
          success: false, 
          message: '只有團隊擁有者可以刪除團隊' 
        });
      }

      // 先刪除團隊相關的待辦事項指派
      db.run(
        `DELETE FROM todo_assignments 
         WHERE todo_id IN (SELECT id FROM todos WHERE team_id = ?)`,
        [id],
        (err) => {
          if (err) {
            console.error('刪除待辦指派錯誤:', err);
          }

          // 刪除團隊的所有待辦事項
          db.run(
            'DELETE FROM todos WHERE team_id = ?',
            [id],
            (err) => {
              if (err) {
                console.error('刪除團隊待辦錯誤:', err);
              }

              // 刪除團隊成員（有 ON DELETE CASCADE，但為確保起見手動刪除）
              db.run(
                'DELETE FROM team_members WHERE team_id = ?',
                [id],
                (err) => {
                  if (err) {
                    console.error('刪除團隊成員錯誤:', err);
                  }

                  // 最後刪除團隊
                  db.run(
                    'DELETE FROM teams WHERE id = ?',
                    [id],
                    function(err) {
                      if (err) {
                        return res.status(500).json({ 
                          success: false, 
                          message: '刪除失敗' 
                        });
                      }

                      res.json({
                        success: true,
                        message: '團隊已刪除'
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// 取得團隊成員
router.get('/:id/members', authenticateToken, (req, res) => {
  const { id } = req.params;

  // 檢查是否為團隊成員
  db.get(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [id, req.user.id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      if (!member) {
        return res.status(403).json({ 
          success: false, 
          message: '無權查看此團隊' 
        });
      }

      // 取得所有成員資訊
      db.all(
        `SELECT u.id as user_id, u.username, u.email, tm.role, tm.joined_at
         FROM team_members tm
         INNER JOIN users u ON tm.user_id = u.id
         WHERE tm.team_id = ?
         ORDER BY tm.role DESC, tm.joined_at ASC`,
        [id],
        (err, members) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: '伺服器錯誤' 
            });
          }

          res.json({
            success: true,
            members
          });
        }
      );
    }
  );
});

// 新增團隊成員
router.post('/:id/members', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      message: '請輸入電子郵件' 
    });
  }

  // 檢查是否為團隊擁有者或管理員
  db.get(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [id, req.user.id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      if (!member || member.role === 'member') {
        return res.status(403).json({ 
          success: false, 
          message: '只有團隊擁有者可以新增成員' 
        });
      }

      // 查找使用者
      db.get(
        'SELECT id FROM users WHERE email = ?',
        [email.trim()],
        (err, user) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: '伺服器錯誤' 
            });
          }

          if (!user) {
            return res.status(404).json({ 
              success: false, 
              message: '找不到此電子郵件的使用者' 
            });
          }

          // 檢查是否已經是成員
          db.get(
            'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
            [id, user.id],
            (err, existingMember) => {
              if (err) {
                return res.status(500).json({ 
                  success: false, 
                  message: '伺服器錯誤' 
                });
              }

              if (existingMember) {
                return res.status(400).json({ 
                  success: false, 
                  message: '此使用者已經是團隊成員' 
                });
              }

              // 新增成員
              db.run(
                'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
                [id, user.id, 'member'],
                function(err) {
                  if (err) {
                    return res.status(500).json({ 
                      success: false, 
                      message: '新增成員失敗' 
                    });
                  }

                  res.status(201).json({
                    success: true,
                    message: '成員已新增'
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// 移除團隊成員
router.delete('/:id/members/:userId', authenticateToken, (req, res) => {
  const { id, userId } = req.params;

  // 檢查是否為團隊擁有者
  db.get(
    'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [id, req.user.id],
    (err, member) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '伺服器錯誤' 
        });
      }

      if (!member || member.role !== 'owner') {
        return res.status(403).json({ 
          success: false, 
          message: '只有團隊擁有者可以移除成員' 
        });
      }

      // 不能移除擁有者
      db.get(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [id, userId],
        (err, targetMember) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: '伺服器錯誤' 
            });
          }

          if (!targetMember) {
            return res.status(404).json({ 
              success: false, 
              message: '找不到此成員' 
            });
          }

          if (targetMember.role === 'owner') {
            return res.status(400).json({ 
              success: false, 
              message: '無法移除團隊擁有者' 
            });
          }

          // 先移除該成員在此團隊所有待辦的指派
          db.run(
            `DELETE FROM todo_assignments 
             WHERE user_id = ? 
             AND todo_id IN (SELECT id FROM todos WHERE team_id = ?)`,
            [userId, id],
            (err) => {
              if (err) {
                console.error('移除待辦指派錯誤:', err);
                // 繼續執行，即使移除指派失敗
              }

              // 移除團隊成員
              db.run(
                'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
                [id, userId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ 
                      success: false, 
                      message: '移除失敗' 
                    });
                  }

                  res.json({
                    success: true,
                    message: '成員已移除'
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
