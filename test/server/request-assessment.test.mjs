/**
 * `assessRequest` runs in the server (Worker/Node), where CLI agents are
 * actually visible. Every case below is a real request shape: the user agents
 * and Accept headers were captured from the shipped clients or taken from
 * published traffic studies (see src/requestAssessment.ts).
 *
 * Property access is dynamic on purpose: importing a missing *named* export
 * would throw at link time, and the point is an assertion failure that names
 * the missing behaviour.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fp from '../../dist/index.mjs';

const assess = fp.assessRequest;

const assertAssess = (input) => {
    assert.equal(typeof assess, 'function', 'assessRequest should be exported from the package entry point');
    return assess(input);
};

const BROWSER_HEADERS = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24"',
};

test('OpenCode webfetch is recognised by its declared user agent', () => {
    const result = assertAssess({
        userAgent: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OpenCode-User/1.0; +https://opencode.ai',
        headers: {
            accept: 'text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1',
            'accept-language': 'en-US,en;q=0.9',
        },
    });

    assert.equal(result.verdict, 'agent');
    assert.equal(result.product, 'OpenCode');
    assert.equal(result.kind, 'coding');
    assert.equal(result.runsOn, 'user');
    assert.ok(result.confidence >= 0.8, `expected confident match, got ${result.confidence}`);
});

test('the bare `opencode` user agent that OpenCode retries with is the same product', () => {
    const result = assertAssess({ userAgent: 'opencode', headers: { accept: 'text/html' } });
    assert.equal(result.product, 'OpenCode');
});

test('Claude Code is recognised when the marker sits inside Claude-User parens', () => {
    const result = assertAssess({
        userAgent: 'Claude-User (claude-code/2.1.308; +https://support.anthropic.com/)',
        headers: { accept: 'text/markdown, text/html, */*' },
    });

    assert.equal(result.verdict, 'agent');
    assert.equal(result.product, 'Claude Code');
    assert.equal(result.kind, 'coding');
});

test('a markdown preference ranks by header order when q-values tie', () => {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
    const markdownFirst = assertAssess({ userAgent, headers: { accept: 'text/markdown, text/html, */*' } });
    const htmlFirst = assertAssess({ userAgent, headers: { accept: 'text/html, text/markdown' } });

    assert.equal(markdownFirst.verdict, 'agent');
    assert.equal(htmlFirst.verdict, 'human');
});

test('Codex reaching the origin through curl is reported as curl, not Codex', () => {
    const result = assertAssess({
        userAgent: 'curl/8.23.0',
        headers: { accept: '*/*' },
    });

    assert.equal(result.verdict, 'crawler');
    assert.equal(result.kind, 'http-client');
    assert.equal(result.product, null);
    assert.ok(result.signals.some((s) => s.includes('curl')), `expected a curl signal, got ${result.signals}`);
});

test('Cursor reports itself as Cursor only when the app itself makes the request', () => {
    const result = assertAssess({ userAgent: 'Cursor/3.0.16 (darwin arm64)' });
    assert.equal(result.product, 'Cursor');
});

test('a browser navigation with a full header set stays human with low confidence', () => {
    const result = assertAssess({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        headers: BROWSER_HEADERS,
    });

    assert.equal(result.verdict, 'human');
    assert.equal(result.confidence, 0.5);
});

test('headers that no browser navigation sends are recorded as evidence without a verdict', () => {
    const result = assertAssess({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        headers: { accept: '*/*' },
    });

    assert.ok(
        result.signals.includes('request:headers:no-browser-markers'),
        `expected the absence signal, got ${result.signals}`,
    );
    assert.ok(result.confidence < 0.5, 'a claim of human should be weakened, not promoted');
});

test('no user agent and no headers is unknown, not human', () => {
    const result = assertAssess({});
    assert.equal(result.verdict, 'unknown');
    assert.equal(result.confidence, 0);
});
