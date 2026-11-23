/**
 * Minimal static server for the automation matrix.
 *
 * Serves the repository root so `/page.html` and `/dist/index.mjs` resolve
 * exactly as they would on a real origin. Binds to 127.0.0.1 only.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

export async function startServer() {
    const server = createServer(async (request, response) => {
        try {
            const url = new URL(request.url ?? '/', 'http://127.0.0.1');
            const pathname = url.pathname === '/' ? '/test/automation/page.html' : url.pathname;
            const filePath = normalize(join(ROOT, pathname));

            // Never serve outside the repository root.
            if (!filePath.startsWith(normalize(ROOT + sep))) {
                response.writeHead(403).end('forbidden');
                return;
            }

            const body = await readFile(filePath);
            response.writeHead(200, {
                'content-type': TYPES[extname(filePath)] ?? 'application/octet-stream',
                'cache-control': 'no-store',
            });
            response.end(body);
        } catch {
            response.writeHead(404).end('not found');
        }
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();

    return {
        url: `http://127.0.0.1:${port}/test/automation/page.html`,
        close: () => new Promise(resolve => server.close(resolve)),
    };
}
