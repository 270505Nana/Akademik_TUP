import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import swaggerSpec from './config/swagger.js';
import { basicAuthSwagger } from './middlewares/basicAuth.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

import indexRouter from './routes/index.js';
import apiRouter from './routes/api/index.js';
import healthRouter from './routes/api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows cross-origin preview of static assets/PDFs
  })
);

// CORS Configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['*'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
};

// Middlewares
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

const swaggerUiOptions = {
  swaggerOptions: {
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
};

// API Documentation (Swagger UI) - Protected by basicAuthSwagger per old backend
app.use('/swagger', basicAuthSwagger, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use('/api-docs', basicAuthSwagger, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Serve raw Swagger JSON spec
app.get('/api-docs.json', basicAuthSwagger, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root & Health Check routes
app.use('/health', healthRouter);
app.use('/', indexRouter);
app.use('/api', apiRouter);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
