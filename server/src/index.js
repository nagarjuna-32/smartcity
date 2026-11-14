import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initSchema } from './database/db.js';
import { seedDatabase } from './database/seed.js';

import authRoutes from './routes/auth.js';
import districtRoutes from './routes/districts.js';
import talukRoutes from './routes/taluks.js';
import areaRoutes from './routes/areas.js';
import facilityRoutes from './routes/facilities.js';
import planningRoutes from './routes/planning.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & ensure base dataset is seeded
initSchema();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/taluks', talukRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Tumakuru Smart City Planning & Facility Mapping System',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve frontend static build if present
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`🏙️  TUMAKURU SMART CITY - Geographic Intelligence & Planning System`);
  console.log(`⚡  API Server running on http://127.0.0.1:${PORT}`);
  console.log(`📍  District: Tumakuru, Karnataka, India`);
  console.log(`================================================================`);
});
