import express, { Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import newsRoutes from './routes/news';
import errorHandler from './middlewares/errorHandler';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import cors from 'cors';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

// Set trust proxy to true for environments like Vercel that use proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images to be served cross-origin
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allowed origins
const allowedOrigins = [
  'https://newz-dashboard.vercel.app',
  'https://dmwv-new.vercel.app',
  "http://localhost:5173"
];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'DMWV News Backend API',
    status: 'ok',
    environment: process.env.NODE_ENV ?? 'development',
    version: process.env.npm_package_version ?? '1.0.0',
    uptimeSeconds: process.uptime(),
    endpoints: {
      health: '/health',
      liveness: '/health/live',
      readiness: '/health/ready',
      info: '/info',
      metrics: '/metrics',
      docs: '/api-docs',
      auth: '/api/auth',
      news: '/api/news'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'live' });
});

app.get('/health/ready', (req: Request, res: Response) => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const readyState = mongoose.connection.readyState;
  const status = readyState === 1 ? 'ready' : 'not_ready';

  res.status(status === 'ready' ? 200 : 503).json({
    status,
    dbState: states[readyState] ?? 'unknown'
  });
});

app.get('/info', (req: Request, res: Response) => {
  res.status(200).json({
    name: process.env.npm_package_name ?? 'dmwv-news-backend',
    version: process.env.npm_package_version ?? '1.0.0',
    environment: process.env.NODE_ENV ?? 'development',
    port: process.env.PORT ?? 5001,
    uptimeSeconds: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/metrics', (req: Request, res: Response) => {
  const cpuUsage = process.cpuUsage();
  const resourceUsage = process.resourceUsage();

  res.status(200).json({
    cpuLoad: os.loadavg(),
    cpuUsage,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    resourceUsage
  });
});

app.use(errorHandler);

export default app;