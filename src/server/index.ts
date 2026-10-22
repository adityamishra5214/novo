import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { getDb } from './db/client.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter, createPublicAuthRouter } from './routes/auth.js';
import { createWorkspacesRouter } from './routes/workspaces.js';
import { createTargetsRouter } from './routes/targets.js';
import { createSalesEntriesRouter } from './routes/salesEntries.js';
import { createAnalyticsRouter } from './routes/analytics.js';
import { createAuditRouter } from './routes/audit.js';

export function createServer() {
  const db = getDb();
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'supabase' });
  });

  // API v1 router
  const apiV1 = express.Router();

  // Public authentication routes (login, register, logout)
  apiV1.use('/auth', createPublicAuthRouter(db));

  // Protected routes require valid session or membership header
  apiV1.use(authenticate(db));

  apiV1.use('/auth', createAuthRouter(db));
  apiV1.use('/workspaces', createWorkspacesRouter(db));
  apiV1.use('/workspaces', createTargetsRouter(db));
  apiV1.use('/workspaces', createSalesEntriesRouter(db));
  apiV1.use('/workspaces', createAnalyticsRouter(db));
  apiV1.use('/workspaces', createAuditRouter(db));

  app.use('/api/v1', apiV1);

  // Error handling middleware
  app.use(errorHandler);

  // Serve static assets in production if dist directory exists
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

const PORT = process.env.PORT || 3001;

import { fileURLToPath } from 'node:url';

// Standalone server execution
if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()) {
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Vantage backend listening on http://localhost:${PORT} (Supabase Connected)`);
  });
}
