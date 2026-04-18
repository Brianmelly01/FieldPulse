const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize DB then mount routes
const { getDb } = require('./database/db');

getDb().then(() => {
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

  app.listen(PORT, () => {
    console.log(`\n🌱  FieldPulse API  →  http://localhost:${PORT}`);
    console.log(`📊  Frontend        →  http://localhost:5173\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
