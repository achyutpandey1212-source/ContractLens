import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import contractRoutes from './routes/contract.routes.js';

const app: Express = express();

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman) or matching frontend
      if (!origin || origin === clientOrigin || origin === 'http://localhost:5173') {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for hackathon development
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoutes);
app.use('/api/contracts', contractRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
});

export default app;
