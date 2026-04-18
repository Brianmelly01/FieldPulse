const sqlite3 = require('sqlite3').verbose();
const bcrypt   = require('bcryptjs');
const path     = require('path');

const DB_PATH = path.join(__dirname, '../fieldpulse.db');

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
  await seedDefaultAdmin(_db);
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

// ── Default admin ──────────────────────────────────────────
async function seedDefaultAdmin(db) {
  const existing = await db.get('SELECT id FROM users WHERE email = ?', ['coordinator@fieldpulse.com']);
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
      ['Dr. Kofi Mensah', 'coordinator@fieldpulse.com', hash, 'admin']);
    console.log('✅ Default admin seeded → coordinator@fieldpulse.com / admin123');
  }
}

module.exports = { getDb };
