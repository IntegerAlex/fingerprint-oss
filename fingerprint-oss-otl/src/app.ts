import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import createHttpError from 'http-errors';

import { errorMiddleware } from './shared/error';
import { healthRouter } from './shared/health';
import { tracesRouter } from './traces/router';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(urlencoded({ extended: false }));
  app.use(json({ limit: '5mb' }));

  app.use('/health', healthRouter);
  app.use('/v1/traces', tracesRouter);

  app.use((req, _res, next) => {
    next(createHttpError(404, 'Not Found'));
  });
  app.use(errorMiddleware);
  return app;
}


