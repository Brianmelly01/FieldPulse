/**
 * Vercel Serverless Function entry point.
 * Vercel requires function files to live in /api at the project root.
 * This file is a thin adapter that delegates to the Express app in /server.
 */
const path = require('path');

// Point Node's module resolution to the server directory so that
// all require() calls inside server/* resolve against server/node_modules.
process.chdir(path.join(__dirname, '..', 'server'));

module.exports = require('../server/index.js');
