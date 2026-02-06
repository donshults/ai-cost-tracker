import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authenticateApiKey } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import usageRouter from './routes/usage';
import modelsRouter from './routes/models';

const app = express();
const PORT = process.env.PORT ?? 3000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 1000 : 0, // Limit each IP to 1000 requests per windowMs (disabled in dev)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Auth middleware
app.use(authenticateApiKey);

// Routes
app.use('/health', healthRouter);
app.use('/api/usage', usageRouter);
app.use('/api/models', modelsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI Cost Tracker',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      health: '/health',
      usage: '/api/usage',
      models: '/api/models',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Cost Tracker running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
