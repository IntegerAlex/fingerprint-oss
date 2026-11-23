/**
 * One driver per browser-automation ecosystem:
 *  - puppeteer  (Chrome DevTools Protocol via puppeteer-core)
 *  - playwright (its own CDP driver)
 *  - selenium   (W3C WebDriver, via chromedriver)
 *
 * All three use the same local Chromium so the results differ because of the
 * framework, not the browser build.
 */
import { CHROME, CHROMEDRIVER } from './browsers.mjs';
import { PROBE } from './probe.mjs';

const LAUNCH_ARGS = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];

export async function runPuppeteer(url) {
    const puppeteer = (await import('puppeteer-core')).default;
    const browser = await puppeteer.launch({
        executablePath: CHROME,
        headless: true,
        args: LAUNCH_ARGS,
    });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
        await page.waitForFunction('window.fpReady === true', { timeout: 15_000 });
        return await page.evaluate(PROBE);
    } finally {
        await browser.close();
    }
}

export async function runPlaywright(url) {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({
        executablePath: CHROME,
        headless: true,
        args: LAUNCH_ARGS,
    });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
        await page.waitForFunction(() => window.fpReady === true, null, { timeout: 15_000 });
        return await page.evaluate(PROBE);
    } finally {
        await browser.close();
    }
}

export async function runSelenium(url) {
    const { Builder } = await import('selenium-webdriver');
    const chrome = (await import('selenium-webdriver/chrome.js')).default;

    const options = new chrome.Options()
        .setChromeBinaryPath(CHROME)
        .addArguments('--headless=new', '--window-size=1280,800', ...LAUNCH_ARGS);

    let builder = new Builder().forBrowser('chrome').setChromeOptions(options);
    if (CHROMEDRIVER) {
        builder = builder.setChromeService(new chrome.ServiceBuilder(CHROMEDRIVER));
    }

    const driver = await builder.build();
    try {
        await driver.get(url);
        await driver.wait(
            () => driver.executeScript('return window.fpReady === true'),
            15_000,
            'fingerprint-oss did not load',
        );
        // WebDriver does not await a promise returned from executeScript, so
        // hand the result back through the async script callback.
        return await driver.executeAsyncScript(
            `const done = arguments[arguments.length - 1];
             (${PROBE}).then(done, error => done({ error: String(error) }));`,
        );
    } finally {
        await driver.quit();
    }
}

export const DRIVERS = {
    puppeteer: runPuppeteer,
    playwright: runPlaywright,
    selenium: runSelenium,
};
