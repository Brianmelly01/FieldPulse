const router = require('express').Router();
const { getDb }                      = require('../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { computeStatus }              = require('../utils/status');

router.use(authenticate);

// ── Helpers ──────────────────────────────────────────────────
async function enrichField(db, field) {
  const lastUp = await db.get(
    'SELECT created_at FROM field_updates WHERE field_id=? ORDER BY created_at DESC LIMIT 1',
    [field.id]
  );
  return {
    ...field,
    status:           computeStatus(field, lastUp?.created_at || null),
    last_update_date: lastUp?.created_at || null,
  };
}

const FIELDS_SQL = `
  SELECT f.*,
         u.name  AS agent_name,
         u.email AS agent_email
  FROM   fields f
  LEFT JOIN users u ON u.id = f.assigned_to
`;

// ── GET /api/fields ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db     = await getDb();
    const rows   = req.user.role === 'admin'
      ? await db.all(FIELDS_SQL + ' ORDER BY f.updated_at DESC')
      : await db.all(FIELDS_SQL + ' WHERE f.assigned_to=? ORDER BY f.updated_at DESC', [req.user.id]);
    const fields = await Promise.all(rows.map(f => enrichField(db, f)));
    res.json(fields);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/fields/:id ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const db    = await getDb();
    const field = await db.get(FIELDS_SQL + ' WHERE f.id=?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (req.user.role === 'agent' && field.assigned_to !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json(await enrichField(db, field));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/fields ──────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, crop_type, planting_date, current_stage, location, area_hectares, description, assigned_to } = req.body;
    if (!name || !crop_type || !planting_date)
      return res.status(400).json({ error: 'name, crop_type, planting_date are required' });

    const stage = current_stage || 'Planted';
    if (!['Planted','Growing','Ready','Harvested'].includes(stage))
      return res.status(400).json({ error: 'Invalid stage' });

    const db = await getDb();
    const r  = await db.run(
      `INSERT INTO fields (name,crop_type,planting_date,current_stage,location,area_hectares,description,assigned_to,created_by,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`,
      [name.trim(), crop_type.trim(), planting_date, stage, location||null,
       area_hectares||1.0, description||null, assigned_to||null, req.user.id]
    );
    const newField = await db.get(FIELDS_SQL + ' WHERE f.id=?', [r.lastID]);
    res.status(201).json(await enrichField(db, newField));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/fields/:id ───────────────────────────────────────
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db    = await getDb();
    const field = await db.get('SELECT * FROM fields WHERE id=?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const { name, crop_type, planting_date, current_stage, location, area_hectares, description, assigned_to } = req.body;
    await db.run(
      `UPDATE fields SET name=?,crop_type=?,planting_date=?,current_stage=?,location=?,area_hectares=?,description=?,assigned_to=?,updated_at=datetime('now') WHERE id=?`,
      [
        name          || field.name,
        crop_type     || field.crop_type,
        planting_date || field.planting_date,
        current_stage || field.current_stage,
        location      ?? field.location,
        area_hectares ?? field.area_hectares,
        description   ?? field.description,
        assigned_to !== undefined ? (assigned_to || null) : field.assigned_to,
        req.params.id
      ]
    );
    const updated = await db.get(FIELDS_SQL + ' WHERE f.id=?', [req.params.id]);
    res.json(await enrichField(db, updated));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/fields/:id ────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db    = await getDb();
    const field = await db.get('SELECT id FROM fields WHERE id=?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    await db.run('DELETE FROM fields WHERE id=?', [req.params.id]);
    res.json({ message: 'Field deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/fields/:id/updates ───────────────────────────────
router.get('/:id/updates', async (req, res) => {
  try {
    const db    = await getDb();
    const field = await db.get('SELECT * FROM fields WHERE id=?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (req.user.role === 'agent' && field.assigned_to !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const updates = await db.all(
      `SELECT fu.*, u.name AS agent_name
       FROM field_updates fu JOIN users u ON u.id=fu.agent_id
       WHERE fu.field_id=? ORDER BY fu.created_at DESC`,
      [req.params.id]
    );
    res.json(updates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/fields/:id/updates ──────────────────────────────
router.post('/:id/updates', async (req, res) => {
  try {
    const db    = await getDb();
    const field = await db.get('SELECT * FROM fields WHERE id=?', [req.params.id]);
    if (!field) return res.status(404).json({ error: 'Field not found' });
    if (req.user.role === 'agent' && field.assigned_to !== req.user.id)
      return res.status(403).json({ error: 'You are not assigned to this field' });

    const { stage, notes } = req.body;
    if (!stage) return res.status(400).json({ error: 'stage is required' });
    if (!['Planted','Growing','Ready','Harvested'].includes(stage))
      return res.status(400).json({ error: 'Invalid stage' });

    const r = await db.run(
      'INSERT INTO field_updates (field_id,agent_id,stage,notes) VALUES (?,?,?,?)',
      [req.params.id, req.user.id, stage, notes||null]
    );
    await db.run(
      "UPDATE fields SET current_stage=?, updated_at=datetime('now') WHERE id=?",
      [stage, req.params.id]
    );

    const newUpdate = await db.get(
      `SELECT fu.*, u.name AS agent_name FROM field_updates fu JOIN users u ON u.id=fu.agent_id WHERE fu.id=?`,
      [r.lastID]
    );
    res.status(201).json(newUpdate);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
