const sqlite3 = require('sqlite3').verbose();
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

// On Vercel (serverless) write to /tmp — ephemeral but works.
// Locally write next to the server folder.
const isVercel = process.env.VERCEL === '1';
const DB_PATH  = isVercel
  ? '/tmp/fieldpulse.db'
  : path.join(__dirname, '../fieldpulse.db');

// ── Promisified DB wrapper ─────────────────────────────────
class DB {
  constructor(filePath) {
    this._db = new sqlite3.Database(filePath);
    this._db.run('PRAGMA journal_mode = WAL');
    this._db.run('PRAGMA foreign_keys = ON');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.get(sql, params, (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this._db.all(sql, params, (err, rows) => {
        if (err) reject(err); else resolve(rows || []);
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this._db.exec(sql, (err) => {
        if (err) reject(err); else resolve();
      });
    });
  }
}

// Singleton
let _db = null;

async function getDb() {
  if (_db) return _db;
  _db = new DB(DB_PATH);
  await initSchema(_db);
  await seedIfEmpty(_db);
  return _db;
}

// ── Schema ─────────────────────────────────────────────────
async function initSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'agent'
                         CHECK(role IN ('admin','agent')),
      created_at DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fields (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      crop_type     TEXT    NOT NULL,
      planting_date DATE    NOT NULL,
      current_stage TEXT    NOT NULL DEFAULT 'Planted'
                    CHECK(current_stage IN ('Planted','Growing','Ready','Harvested')),
      location      TEXT,
      area_hectares REAL    DEFAULT 1.0,
      description   TEXT,
      assigned_to   INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by    INTEGER REFERENCES users(id),
      created_at    DATETIME DEFAULT (datetime('now')),
      updated_at    DATETIME DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS field_updates (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      field_id   INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
      agent_id   INTEGER NOT NULL REFERENCES users(id),
      stage      TEXT    NOT NULL,
      notes      TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    );
  `);
}

// ── Auto-seed on cold start (for Vercel /tmp) ──────────────
async function seedIfEmpty(db) {
  const existing = await db.get('SELECT COUNT(*) AS c FROM users');
  if (existing.c > 0) return; // already seeded

  console.log('🌱 Seeding demo data...');
  const adminPw = bcrypt.hashSync('admin123', 10);
  const agentPw = bcrypt.hashSync('agent123', 10);

  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Dr. Kofi Mensah',  'coordinator@fieldpulse.com', adminPw, 'admin']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Sarah Owusu',       'sarah@fieldpulse.com',       adminPw, 'admin']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['James Asante',      'james@fieldpulse.com',       agentPw, 'agent']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Amara Diallo',      'amara@fieldpulse.com',       agentPw, 'agent']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)', ['Kwame Boateng',     'kwame@fieldpulse.com',       agentPw, 'agent']);

  const admin = await db.get("SELECT id FROM users WHERE email='coordinator@fieldpulse.com'");
  const james = await db.get("SELECT id FROM users WHERE email='james@fieldpulse.com'");
  const amara = await db.get("SELECT id FROM users WHERE email='amara@fieldpulse.com'");
  const kwame = await db.get("SELECT id FROM users WHERE email='kwame@fieldpulse.com'");

  function daysAgo(n) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
  function ts(n) {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  const fSql = `INSERT INTO fields (name,crop_type,planting_date,current_stage,location,area_hectares,description,assigned_to,created_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`;

  const f1  = await db.run(fSql, ['Mensah North Block',  'Maize',    daysAgo(48),  'Growing',  'Northern Ridge, Sector 4',  3.5, 'Primary maize block. Irrigation system recently upgraded.',    james.id, admin.id, daysAgo(3)]);
  const f2  = await db.run(fSql, ['Diallo South Ridge',  'Cassava',  daysAgo(13),  'Planted',  'Southern Belt, Plot B12',   2.2, 'New cassava batch. Soil testing completed before planting.',   amara.id, admin.id, daysAgo(5)]);
  const f3  = await db.run(fSql, ['Upper Valley Plot A', 'Tomatoes', daysAgo(93),  'Ready',    'Upper Valley, Block A',     1.8, 'Premium tomato variety. Ready for market harvest.',            james.id, admin.id, daysAgo(2)]);
  const f4  = await db.run(fSql, ['Central Plains',      'Maize',    daysAgo(20),  'Planted',  'Central Zone, Grid 7',      4.0, 'Hybrid maize variety. Expected high yield season.',            james.id, admin.id, daysAgo(4)]);
  const f5  = await db.run(fSql, ['Sunrise Paddock',     'Beans',    daysAgo(60),  'Growing',  'East Paddock, Row 1-8',     1.5, 'French beans for local market.',                               kwame.id, admin.id, daysAgo(5)]);
  const f6  = await db.run(fSql, ['Valley Basin',        'Tomatoes', daysAgo(88),  'Ready',    'Valley Basin, Section C',   2.6, 'Cherry tomatoes. Export-grade quality expected.',              james.id, admin.id, daysAgo(1)]);
  const f7  = await db.run(fSql, ['Western Farmstead',   'Sorghum',  daysAgo(165), 'Growing',  'West Farm, Plot 3',         5.0, 'Sorghum slow to germinate. Extended growing period.',          amara.id, admin.id, daysAgo(22)]);
  const f8  = await db.run(fSql, ['Eastern Corridor',    'Rice',     daysAgo(55),  'Growing',  'Eastern Water Belt',        3.8, 'Paddy rice. Requires consistent water monitoring.',            kwame.id, admin.id, daysAgo(18)]);
  const f9  = await db.run(fSql, ['Riverside Belt',      'Beans',    daysAgo(110), 'Harvested','Riverside, Plot D',         2.0, 'Excellent season. Beans yielded 2.1 tonnes/hectare.',          kwame.id, admin.id, daysAgo(10)]);
  const f10 = await db.run(fSql, ['Blue Hill Terrace',   'Cassava',  daysAgo(200), 'Harvested','Blue Hill, Terrace 1',      4.5, 'Record yield season.',                                         amara.id, admin.id, daysAgo(15)]);

  const uSql = 'INSERT INTO field_updates (field_id,agent_id,stage,notes,created_at) VALUES (?,?,?,?,?)';
  await db.run(uSql, [f1.lastID,  james.id, 'Planted',  'Seeds sown in rows. Soil moisture is good.',                   ts(48)]);
  await db.run(uSql, [f1.lastID,  james.id, 'Growing',  'First shoots visible. Applied fertilizer.',                    ts(20)]);
  await db.run(uSql, [f1.lastID,  james.id, 'Growing',  'Strong growth observed. Plants at 80cm.',                      ts(3)]);
  await db.run(uSql, [f2.lastID,  amara.id, 'Planted',  'Cuttings planted at 1m spacing.',                              ts(13)]);
  await db.run(uSql, [f3.lastID,  james.id, 'Planted',  'Tomato seedlings transplanted.',                               ts(93)]);
  await db.run(uSql, [f3.lastID,  james.id, 'Growing',  'Plants flowering well. Staking complete.',                     ts(45)]);
  await db.run(uSql, [f3.lastID,  james.id, 'Ready',    'Fruits are large and ripening. Ready in 5-7 days.',            ts(2)]);
  await db.run(uSql, [f4.lastID,  james.id, 'Planted',  'Hybrid seed planted. Rain was good this week.',                ts(20)]);
  await db.run(uSql, [f5.lastID,  kwame.id, 'Planted',  'French beans direct-sown.',                                    ts(60)]);
  await db.run(uSql, [f5.lastID,  kwame.id, 'Growing',  'Pods forming nicely. Applied potassium top-dress.',            ts(5)]);
  await db.run(uSql, [f6.lastID,  james.id, 'Planted',  'Cherry tomato seedlings set out. Mulch applied.',              ts(88)]);
  await db.run(uSql, [f6.lastID,  james.id, 'Growing',  'Beautiful growth. Trellising complete.',                       ts(40)]);
  await db.run(uSql, [f6.lastID,  james.id, 'Ready',    'Cherry tomatoes turning red. Brix level excellent.',           ts(1)]);
  await db.run(uSql, [f7.lastID,  amara.id, 'Planted',  'Sorghum seed sown. Soil was a bit dry.',                       ts(165)]);
  await db.run(uSql, [f7.lastID,  amara.id, 'Growing',  'Slow germination due to dry spell.',                           ts(80)]);
  await db.run(uSql, [f7.lastID,  amara.id, 'Growing',  'Regrowth after rains. Still behind schedule.',                 ts(22)]);
  await db.run(uSql, [f8.lastID,  kwame.id, 'Planted',  'Seed rice sown broadcast.',                                    ts(55)]);
  await db.run(uSql, [f8.lastID,  kwame.id, 'Growing',  'Seedlings establishing. Water level maintained.',              ts(18)]);
  await db.run(uSql, [f9.lastID,  kwame.id, 'Planted',  'Beans planted in double rows.',                                ts(110)]);
  await db.run(uSql, [f9.lastID,  kwame.id, 'Growing',  'Excellent vine development.',                                  ts(70)]);
  await db.run(uSql, [f9.lastID,  kwame.id, 'Ready',    'Pods fully formed and drying.',                                ts(18)]);
  await db.run(uSql, [f9.lastID,  kwame.id, 'Harvested','Harvest complete. 2.1 t/ha yield. Excellent season!',          ts(10)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Planted',  'Cassava cuttings set.',                                        ts(200)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Growing',  'Tubers forming well.',                                         ts(140)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Ready',    'Tubers large. Market demand is high.',                         ts(20)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Harvested','Full harvest done. Record yield this season!',                  ts(15)]);

  console.log('✅ Demo data seeded.');
}

module.exports = { getDb };
