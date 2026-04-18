const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getDb }                      = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users  (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db    = await getDb();
    const users = await db.all(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             COUNT(f.id) AS field_count
      FROM   users u
      LEFT JOIN fields f ON f.assigned_to = u.id
      GROUP BY u.id
      ORDER BY u.role DESC, u.name ASC
    `);
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/agents  (dropdown list)
router.get('/agents', async (_req, res) => {
  try {
    const db     = await getDb();
    const agents = await db.all("SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY name");
    res.json(agents);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users  (admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'name, email, password, role are required' });
    if (!['admin','agent'].includes(role))
      return res.status(400).json({ error: 'role must be admin or agent' });

    const db   = await getDb();
    const hash = bcrypt.hashSync(password, 10);
    const r    = await db.run(
      'INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      [name.trim(), email.toLowerCase().trim(), hash, role]
    );
    const newUser = await db.get('SELECT id,name,email,role,created_at FROM users WHERE id=?', [r.lastID]);
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id  (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db   = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, role, password } = req.body;
    const newHash = password ? bcrypt.hashSync(password, 10) : user.password;

    await db.run(
      'UPDATE users SET name=?,email=?,role=?,password=? WHERE id=?',
      [name || user.name, (email || user.email).toLowerCase().trim(), role || user.role, newHash, req.params.id]
    );
    const updated = await db.get('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.params.id]);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db   = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'admin') {
      const { c } = await db.get("SELECT COUNT(*) AS c FROM users WHERE role='admin'");
      if (c <= 1) return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }

    await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
