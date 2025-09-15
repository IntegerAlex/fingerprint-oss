export type AppConfig = {
  port: number;
  jwtSecret: string;
  databaseUrl: string;
  nodeEnv: string;
};

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT || 4318);
  const jwtSecret = process.env.JWT_SECRET || '';
  const databaseUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!jwtSecret) throw new Error('JWT_SECRET is not set');
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');
  return { port, jwtSecret, databaseUrl, nodeEnv };
}


