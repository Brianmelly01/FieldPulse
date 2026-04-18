const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

dotenv.config();

// Fallback secret for demo deployments (Vercel, Render, etc.)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'fieldpulse_jwt_secret_key_smartseason_2024';
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '7d';
}

const app  = express();
const PORT = process.env.PORT || 5000;

// Allow both local Vite dev server and Vercel production domain
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

const { getDb } = require('./database/db');

async function bootstrap() {
  await getDb(); // init schema + seed

  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/fields',    require('./routes/fields'));
  app.use('/api/users',     require('./routes/users'));
  app.use('/api/dashboard', require('./routes/dashboard'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'FieldPulse API' }));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, _req, res, _next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });
}

// ── Local dev: start HTTP server ──────────────────────────
if (require.main === module) {
  bootstrap().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🌱  FieldPulse API  →  http://localhost:${PORT}`);
      console.log(`📊  Frontend        →  http://localhost:5173\n`);
    });
  }).catch(err => { console.error(err); process.exit(1); });
}

// ── Vercel: export for serverless handler ─────────────────
let ready = false;
module.exports = async (req, res) => {
  if (!ready) { await bootstrap(); ready = true; }
  app(req, res);
};
// Also attach for @vercel/node compatibility
module.exports.app = app;
