/**
 * Runs the agent assessment inside Puppeteer, Playwright and Selenium and
 * asserts the automation verdict survives all three.
 *
 * Usage: node run.mjs [driver...]   (default: all)
 * Exit code carries npm-style failures so CI can gate on it.
 */
import { startServer } from './serve.mjs';
import { DRIVERS } from './drivers.mjs';
import { CHROME, CHROMEDRIVER } from './browsers.mjs';

const requested = process.argv.slice(2);
const selected = requested.length > 0 ? requested : Object.keys(DRIVERS);

const unknown = selected.filter(name => !(name in DRIVERS));
if (unknown.length > 0) {
    console.error(`unknown driver(s): ${unknown.join(', ')} — choose from ${Object.keys(DRIVERS).join(', ')}`);
    process.exit(2);
}

function check(name, result) {
    const failures = [];
    const { assessment, bot, userAgent, hashStable } = result ?? {};

    if (!assessment) {
        failures.push('no agentAssessment returned');
    } else {
        if (assessment.verdict !== 'automation') {
            failures.push(`verdict is "${assessment.verdict}", expected "automation" (UA: ${userAgent})`);
        }
        if (!assessment.signals?.some(signal => signal.startsWith('automation:botd:'))) {
            failures.push(`no BotD evidence in signals: ${JSON.stringify(assessment.signals)}`);
        }
        if (typeof assessment.confidence !== 'number' || assessment.confidence < 0.6) {
            failures.push(`confidence ${assessment.confidence} is not automation-grade`);
        }
    }

    if (hashStable !== true) failures.push('generateId() is not stable across two collections');
    if (bot == null || typeof bot.isBot !== 'boolean') failures.push('legacy bot field missing');

    return failures;
}

const server = await startServer();
const rows = [];
let failed = 0;

console.log(`chromium: ${CHROME}`);
console.log(`chromedriver: ${CHROMEDRIVER ?? '(managed automatically)'}`);
console.log(`url: ${server.url}\n`);

try {
    for (const name of selected) {
        process.stdout.write(`▶ ${name} … `);
        try {
            const result = await DRIVERS[name](server.url);
            const failures = check(name, result);

            if (failures.length > 0) {
                failed += 1;
                console.log('FAIL');
                for (const failure of failures) console.log(`    - ${failure}`);
            } else {
                console.log('ok');
            }

            rows.push({
                driver: name,
                verdict: result?.assessment?.verdict ?? '-',
                confidence: result?.assessment?.confidence ?? '-',
                evidence: (result?.assessment?.signals ?? []).find(s => s.startsWith('automation:botd:')) ?? '-',
                stable: result?.hashStable === true ? 'yes' : 'no',
                failures: failures.length,
            });
        } catch (error) {
            failed += 1;
            console.log('ERROR');
            console.log(`    - ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
            rows.push({ driver: name, verdict: '-', confidence: '-', evidence: '-', stable: '-', failures: 1 });
        }
    }
} finally {
    await server.close();
}

console.log('\n| driver | verdict | confidence | botd evidence | id stable | failures |');
console.log('|---|---|---|---|---|---|');
for (const row of rows) {
    console.log(`| ${row.driver} | ${row.verdict} | ${row.confidence} | ${row.evidence} | ${row.stable} | ${row.failures} |`);
}

if (failed > 0) {
    console.error(`\n${failed} of ${selected.length} driver(s) failed`);
    process.exit(1);
}

console.log('\nall drivers detected automation');
