import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import siteRoutes from './routes/sites.js';
import siteExpenseRoutes from './routes/siteExpenses.js';
import payrollRoutes from './routes/payroll.js';
import auditRoutes from './routes/audit.js';
import landingRoutes from './routes/landing.js';
import driveRoutes from './routes/drive.js';
// Backup feature disabled - requires Google Workspace for service account storage
// import backupRoutes from './routes/backup.js';
// import { startBackupScheduler } from './services/scheduledBackup.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://bawabt-almaskan-labour-frontend.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (disabled in production)
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
//   next();
// });

// Routes
app.use('/api/landing', landingRoutes); // Public landing page form
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/site-expenses', siteExpenseRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/drive', driveRoutes);
// app.use('/api/backup', backupRoutes); // Disabled - requires Google Workspace

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Labour Management API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      employees: '/api/employees/*',
      attendance: '/api/attendance/*',
      payroll: '/api/payroll/*',
      landing: '/api/landing/submit'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`ℹ️  Backup feature disabled (use manual Google Sheets backup)`);
  
  // Automatic backup disabled - requires Google Workspace
  // startBackupScheduler();
});
