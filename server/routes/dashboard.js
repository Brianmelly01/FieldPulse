const router = require('express').Router();
const { getDb }         = require('../database/db');
const { authenticate }  = require('../middleware/auth');
const { computeStatus } = require('../utils/status');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    const fields = req.user.role === 'admin'
      ? await db.all('SELECT f.*, u.name AS agent_name FROM fields f LEFT JOIN users u ON u.id=f.assigned_to')
      : await db.all('SELECT f.*, u.name AS agent_name FROM fields f LEFT JOIN users u ON u.id=f.assigned_to WHERE f.assigned_to=?', [req.user.id]);

    // Enrich with computed status
    const enriched = await Promise.all(fields.map(async f => {
      const lastUp = await db.get(
        'SELECT created_at FROM field_updates WHERE field_id=? ORDER BY created_at DESC LIMIT 1',
        [f.id]
      );
      return { ...f, status: computeStatus(f, lastUp?.created_at || null) };
    }));

    // Breakdowns
    const statusBreakdown = { Active: 0, 'At Risk': 0, Completed: 0 };
    const stageBreakdown  = { Planted: 0, Growing: 0, Ready: 0, Harvested: 0 };
    enriched.forEach(f => {
      if (statusBreakdown[f.status] !== undefined) statusBreakdown[f.status]++;
      if (stageBreakdown[f.current_stage] !== undefined) stageBreakdown[f.current_stage]++;
    });

    // Recent updates
    const recentUpdates = req.user.role === 'admin'
      ? await db.all(`
          SELECT fu.*, u.name AS agent_name, f.name AS field_name, f.crop_type
          FROM field_updates fu JOIN users u ON u.id=fu.agent_id JOIN fields f ON f.id=fu.field_id
          ORDER BY fu.created_at DESC LIMIT 8
        `)
      : await db.all(`
          SELECT fu.*, u.name AS agent_name, f.name AS field_name, f.crop_type
          FROM field_updates fu JOIN users u ON u.id=fu.agent_id JOIN fields f ON f.id=fu.field_id
          WHERE f.assigned_to=?
          ORDER BY fu.created_at DESC LIMIT 8
        `, [req.user.id]);

    // Admin extras
    let agentCount   = null;
    let agentMetrics = null;
    if (req.user.role === 'admin') {
      const r = await db.get("SELECT COUNT(*) AS c FROM users WHERE role='agent'");
      agentCount = r.c;
      agentMetrics = await db.all(`
        SELECT u.id, u.name,
               COUNT(f.id) AS total_fields,
               SUM(CASE WHEN f.current_stage='Harvested' THEN 1 ELSE 0 END) AS completed
        FROM users u
        LEFT JOIN fields f ON f.assigned_to=u.id
        WHERE u.role='agent'
        GROUP BY u.id ORDER BY total_fields DESC
      `);
    }

    res.json({
      totalFields: enriched.length,
      statusBreakdown,
      stageBreakdown,
      recentUpdates,
      agentCount,
      agentMetrics,
      atRiskFields: enriched.filter(f => f.status === 'At Risk'),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
