import 'dotenv/config';
import { createApp } from './app';
import { initDatabase } from './storage/db';
import { loadConfig } from './shared/config';

const app = createApp();

// eslint-disable-next-line no-console
console.warn('[DEPRECATED] telemetry-server is deprecated and no longer maintained. See README.md.');

const { port } = loadConfig();
initDatabase()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`telemetry-server listening on :${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });


