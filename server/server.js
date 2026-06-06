import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payslipRoutes from './routes/payslipRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('QuickEMS Backend API is running. Please access the frontend React app at http://localhost:5173');
});
app.use('/api/auth',       authRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/leaves',     leaveRoutes);
app.use('/api/payslips',   payslipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/settings',   settingsRoutes);

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Database + Server ────────────────────────────────────────────
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems');
  console.log('✅ Connected to MongoDB');
};

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
} else {
  connectDB().catch((err) => console.error('MongoDB connection error:', err));
}

export default app;
