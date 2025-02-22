import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from dist directory
app.use('/dist', express.static(join(__dirname, '../dist')));

// Serve the test HTML page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'test.html'));
});

app.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
}); 