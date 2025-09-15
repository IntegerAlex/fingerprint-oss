import 'dotenv/config';
import { createApp } from './app';
import { initDatabase } from './storage/db';
import { loadConfig } from './shared/config';

const app = createApp();

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


