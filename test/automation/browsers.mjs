/**
 * Browser paths. Every driver drives the same local Chromium, so the matrix
 * measures the frameworks, not three different browser builds.
 *
 * Override with CHROME_PATH / CHROMEDRIVER_PATH (CI installs its own).
 */
import { accessSync, constants } from 'node:fs';

const CANDIDATES = {
    chrome: [
        process.env.CHROME_PATH,
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean),
    chromedriver: [
        process.env.CHROMEDRIVER_PATH,
        '/usr/bin/chromedriver',
        '/usr/local/bin/chromedriver',
    ].filter(Boolean),
};

function firstExecutable(paths) {
    for (const path of paths) {
        try {
            accessSync(path, constants.X_OK);
            return path;
        } catch { /* try next */ }
    }
    return null;
}

export const CHROME = firstExecutable(CANDIDATES.chrome);
export const CHROMEDRIVER = firstExecutable(CANDIDATES.chromedriver);

if (!CHROME) {
    throw new Error('No Chrome/Chromium found. Set CHROME_PATH to a Chromium binary.');
}
