/**
 * Seed script — run once to populate demo data
 * Usage: npm run seed  (from /server directory)
 */

const bcrypt    = require('bcryptjs');
const { getDb } = require('./db');

async function seed() {
  const db = await getDb();

  // Wipe existing demo data
  await db.exec(`
    DELETE FROM field_updates;
    DELETE FROM fields;
    DELETE FROM users WHERE email != 'coordinator@fieldpulse.com';
  `);

  // ── Users ─────────────────────────────────────────────────
  const hash    = (pw) => bcrypt.hashSync(pw, 10);
  const adminPw = hash('admin123');
  const agentPw = hash('agent123');

  await db.run('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['Dr. Kofi Mensah', 'coordinator@fieldpulse.com', adminPw, 'admin']);
  await db.run('INSERT OR IGNORE INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['Sarah Owusu', 'sarah@fieldpulse.com', adminPw, 'admin']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['James Asante', 'james@fieldpulse.com', agentPw, 'agent']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['Amara Diallo', 'amara@fieldpulse.com', agentPw, 'agent']);
  await db.run('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)',
    ['Kwame Boateng', 'kwame@fieldpulse.com', agentPw, 'agent']);

  const admin = await db.get('SELECT id FROM users WHERE email=?', ['coordinator@fieldpulse.com']);
  const james = await db.get('SELECT id FROM users WHERE email=?', ['james@fieldpulse.com']);
  const amara = await db.get('SELECT id FROM users WHERE email=?', ['amara@fieldpulse.com']);
  const kwame = await db.get('SELECT id FROM users WHERE email=?', ['kwame@fieldpulse.com']);

  // ── Helpers ───────────────────────────────────────────────
  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  function ts(daysBack, hoursBack = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(d.getHours() - hoursBack);
    return d.toISOString();
  }

  // ── Fields ────────────────────────────────────────────────
  const fSql = `
    INSERT INTO fields
      (name, crop_type, planting_date, current_stage, location, area_hectares, description, assigned_to, created_by, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `;

  const f1  = await db.run(fSql, ['Mensah North Block',  'Maize',    daysAgo(48),  'Growing',  'Northern Ridge, Sector 4',   3.5, 'Primary maize block. Irrigation system recently upgraded.',              james.id, admin.id, daysAgo(3)]);
  const f2  = await db.run(fSql, ['Diallo South Ridge',  'Cassava',  daysAgo(13),  'Planted',  'Southern Belt, Plot B12',    2.2, 'New cassava batch. Soil testing completed before planting.',             amara.id, admin.id, daysAgo(5)]);
  const f3  = await db.run(fSql, ['Upper Valley Plot A', 'Tomatoes', daysAgo(93),  'Ready',    'Upper Valley, Block A',      1.8, 'Premium tomato variety. Ready for market harvest.',                      james.id, admin.id, daysAgo(2)]);
  const f4  = await db.run(fSql, ['Central Plains',      'Maize',    daysAgo(20),  'Planted',  'Central Zone, Grid 7',       4.0, 'Hybrid maize variety. Expected high yield season.',                      james.id, admin.id, daysAgo(4)]);
  const f5  = await db.run(fSql, ['Sunrise Paddock',     'Beans',    daysAgo(60),  'Growing',  'East Paddock, Row 1-8',      1.5, 'French beans for local market. Intercropped with sorghum.',             kwame.id, admin.id, daysAgo(5)]);
  const f6  = await db.run(fSql, ['Valley Basin',        'Tomatoes', daysAgo(88),  'Ready',    'Valley Basin, Section C',    2.6, 'Cherry tomatoes. Export-grade quality expected.',                        james.id, admin.id, daysAgo(1)]);
  const f7  = await db.run(fSql, ['Western Farmstead',   'Sorghum',  daysAgo(165), 'Growing',  'West Farm, Plot 3',          5.0, 'Sorghum was slow to germinate. Extended growing period.',               amara.id, admin.id, daysAgo(22)]);
  const f8  = await db.run(fSql, ['Eastern Corridor',    'Rice',     daysAgo(55),  'Growing',  'Eastern Water Belt',         3.8, 'Paddy rice. Requires consistent water monitoring.',                      kwame.id, admin.id, daysAgo(18)]);
  const f9  = await db.run(fSql, ['Riverside Belt',      'Beans',    daysAgo(110), 'Harvested','Riverside, Plot D',          2.0, 'Excellent season. Beans yielded 2.1 tonnes/hectare.',                   kwame.id, admin.id, daysAgo(10)]);
  const f10 = await db.run(fSql, ['Blue Hill Terrace',   'Cassava',  daysAgo(200), 'Harvested','Blue Hill, Terrace 1',       4.5, 'Record yield season. Cassava processed on-site.',                       amara.id, admin.id, daysAgo(15)]);

  // ── Field Updates ─────────────────────────────────────────
  const uSql = 'INSERT INTO field_updates (field_id, agent_id, stage, notes, created_at) VALUES (?,?,?,?,?)';

  // Mensah North Block
  await db.run(uSql, [f1.lastID, james.id, 'Planted',  'Seeds sown in rows. Soil moisture is good.',                     ts(48)]);
  await db.run(uSql, [f1.lastID, james.id, 'Growing',  'First shoots visible. About 15cm height. Applied fertilizer.',   ts(20)]);
  await db.run(uSql, [f1.lastID, james.id, 'Growing',  'Strong growth observed. No pest activity. Plants at 80cm.',      ts(3)]);

  // Diallo South Ridge
  await db.run(uSql, [f2.lastID, amara.id, 'Planted',  'Cuttings planted at 1m spacing. Soil well-prepared.',            ts(13)]);
  await db.run(uSql, [f2.lastID, amara.id, 'Planted',  'Light rainfall helped settling. Good coverage so far.',          ts(5)]);

  // Upper Valley Plot A
  await db.run(uSql, [f3.lastID, james.id, 'Planted',  'Tomato seedlings transplanted. Drip irrigation set up.',         ts(93)]);
  await db.run(uSql, [f3.lastID, james.id, 'Growing',  'Plants flowering well. Staking complete. Pest control applied.', ts(45)]);
  await db.run(uSql, [f3.lastID, james.id, 'Ready',    'Fruits are large and ripening. Ready for harvest in 5-7 days.',  ts(2)]);

  // Central Plains
  await db.run(uSql, [f4.lastID, james.id, 'Planted',  'Hybrid seed planted. Rain was good this week.',                  ts(20)]);
  await db.run(uSql, [f4.lastID, james.id, 'Planted',  'Germination rate about 90%. Looking strong.',                    ts(4)]);

  // Sunrise Paddock
  await db.run(uSql, [f5.lastID, kwame.id, 'Planted',  'French beans direct-sown. Intercropped row layout done.',        ts(60)]);
  await db.run(uSql, [f5.lastID, kwame.id, 'Growing',  'Beans growing well. First flowers appearing at week 6.',         ts(15)]);
  await db.run(uSql, [f5.lastID, kwame.id, 'Growing',  'Pods forming nicely. Applied potassium top-dress.',              ts(5)]);

  // Valley Basin
  await db.run(uSql, [f6.lastID, james.id, 'Planted',  'Cherry tomato seedlings set out. Mulch applied.',               ts(88)]);
  await db.run(uSql, [f6.lastID, james.id, 'Growing',  'Beautiful growth. Trellising complete.',                         ts(40)]);
  await db.run(uSql, [f6.lastID, james.id, 'Ready',    'Cherry tomatoes turning red. Brix level excellent.',             ts(1)]);

  // Western Farmstead (AT RISK – old + no recent update)
  await db.run(uSql, [f7.lastID, amara.id, 'Planted',  'Sorghum seed sown. Soil was a bit dry but manageable.',         ts(165)]);
  await db.run(uSql, [f7.lastID, amara.id, 'Growing',  'Slow germination due to dry spell. About 40% coverage.',        ts(80)]);
  await db.run(uSql, [f7.lastID, amara.id, 'Growing',  'Regrowth after rains. Still behind schedule.',                  ts(22)]);

  // Eastern Corridor (AT RISK – no update in 18 days)
  await db.run(uSql, [f8.lastID, kwame.id, 'Planted',  'Paddies flooded and seed rice sown broadcast.',                 ts(55)]);
  await db.run(uSql, [f8.lastID, kwame.id, 'Growing',  'Seedlings establishing. Water level maintained at 5cm.',        ts(18)]);

  // Riverside Belt (Harvested)
  await db.run(uSql, [f9.lastID, kwame.id, 'Planted',  'Beans planted in double rows.',                                 ts(110)]);
  await db.run(uSql, [f9.lastID, kwame.id, 'Growing',  'Excellent vine development. No disease noted.',                 ts(70)]);
  await db.run(uSql, [f9.lastID, kwame.id, 'Ready',    'Pods fully formed and drying. Ready to harvest.',              ts(18)]);
  await db.run(uSql, [f9.lastID, kwame.id, 'Harvested','Harvest complete. 2.1 t/ha yield. Excellent season!',          ts(10)]);

  // Blue Hill Terrace (Harvested)
  await db.run(uSql, [f10.lastID, amara.id, 'Planted',  'Cassava cuttings set. Traditional variety.',                  ts(200)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Growing',  'Tubers forming well. Canopy cover solid.',                    ts(140)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Growing',  'Inspected roots — healthy and sizing up.',                    ts(60)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Ready',    'Tubers large and starchy. Market demand is high.',            ts(20)]);
  await db.run(uSql, [f10.lastID, amara.id, 'Harvested','Full harvest done. Record yield this season!',                ts(15)]);

  console.log('\n🌾  FieldPulse seed data loaded successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log('Demo Credentials:');
  console.log('  Admin  →  coordinator@fieldpulse.com  /  admin123');
  console.log('  Admin  →  sarah@fieldpulse.com        /  admin123');
  console.log('  Agent  →  james@fieldpulse.com        /  agent123');
  console.log('  Agent  →  amara@fieldpulse.com        /  agent123');
  console.log('  Agent  →  kwame@fieldpulse.com        /  agent123');
  console.log('─────────────────────────────────────────\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
