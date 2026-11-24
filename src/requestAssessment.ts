/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */

/**
 * Request-layer agent assessment.
 *
 * `assessAgent()` runs inside the page, so it can only see clients that execute
 * the bundle. Terminal and backend agents fetch with their own HTTP client and
 * never run page JavaScript: OpenCode, Claude Code, Cursor, Codex, Gemini CLI
 * all do this. They are visible at the request layer, and only there.
 *
 * Everything below is either a header claim or a class-level behaviour:
 *
 *  - a small local slice of the public agent-traffic datasets (mintlify's
 *    `agent-traffic` and dacharycarey's classifier), verified against the
 *    shipped clients where possible;
 *  - `Accept` content negotiation: no browser sends `text/markdown`, so a
 *    markdown-first preference identifies the class even when the user agent
 *    is a stock Chrome string (OpenCode before August 2026, Cursor, curl
 *    run by hand).
 *
 * Known ceiling: attribution follows whoever runs the fetcher, not the product
 * the user is typing into. Cursor's fetch runs on Exa and arrives as
 * `ExaUser`; Codex's search goes to OpenAI's API and may never touch the
 * origin; Antigravity arrives from Google proxy addresses. A `null` product is
 * the honest answer there, not a missing entry.
 */

import { isbot } from 'isbot';
import type { AgentAssessment } from './types.js';

export type RequestClientKind = 'coding' | 'assistant' | 'browser' | 'http-client';
export type RequestRunsOn = 'user' | 'operator';

export interface RequestAssessment extends AgentAssessment {
    /** Named product, when the request identifies one. `null` means "not visible here". */
    product: string | null;
    kind: RequestClientKind | null;
    /** Whether the fetch leaves the user's machine or an operator's servers. */
    runsOn: RequestRunsOn | null;
}

export interface AssessRequestInput {
    userAgent?: string | null;
    /** Request headers. `Record<string, string | string[]>` or a `Headers` instance. */
    headers?: Record<string, string | string[] | undefined> | Headers | null;
}

interface DeclaredClient {
    product: string;
    kind: RequestClientKind;
    runsOn: RequestRunsOn;
    match: RegExp;
}

/**
 * Self-declared request clients, most specific first: Claude Code sends a
 * `Claude-User (...)` prefix, so it must be tested before the assistant row.
 */
const DECLARED_CLIENTS: DeclaredClient[] = [
    {
        product: 'OpenCode',
        kind: 'coding',
        runsOn: 'user',
        // The default web-fetch UA, its pre-Aug-2026 bare token, and the
        // Cloudflare-challenge fallback in packages/core/src/tool/plugin/webfetch.ts.
        match: /\bOpenCode-User\/|^opencode$|^opencode-smartfetch\//i,
    },
    {
        product: 'Claude Code',
        kind: 'coding',
        runsOn: 'user',
        match: /\bclaude-code\/\d/i,
    },
    {
        product: 'Cursor',
        kind: 'coding',
        runsOn: 'user',
        match: /(^|[\s;(])Cursor\/\d+(?:\.\d+)+/i,
    },
    {
        product: 'GitHub Copilot',
        kind: 'coding',
        runsOn: 'user',
        match: /\bGitHubCopilot[A-Za-z-]*/i,
    },
    {
        product: 'Qoder',
        kind: 'coding',
        runsOn: 'user',
        match: /^qodercli(?:cn)?\//i,
    },
    {
        product: 'Augment Code',
        kind: 'coding',
        runsOn: 'user',
        match: /^Augment-WebFetch\//i,
    },
    {
        product: 'ZCode',
        kind: 'coding',
        runsOn: 'user',
        match: /\bZCode-WebFetch\//i,
    },
    {
        product: 'Aider',
        kind: 'coding',
        runsOn: 'user',
        match: /\bAider\/\d/i,
    },
    {
        product: 'Kiro',
        kind: 'coding',
        runsOn: 'operator',
        match: /^KiroServer\/|^Kiro-CLI\b/i,
    },
    {
        product: 'Antigravity',
        kind: 'coding',
        runsOn: 'operator',
        match: /\bGoogle-Jetski-Antigravity\b/i,
    },
    {
        product: 'Google Agent',
        kind: 'coding',
        runsOn: 'operator',
        match: /\bGoogleAgent-URLContext\b|\bGoogle-Gemini-CLI\//i,
    },
    {
        product: 'Exa',
        kind: 'assistant',
        runsOn: 'operator',
        match: /\bExaUser\//i,
    },
    {
        product: 'Claude-User',
        kind: 'assistant',
        runsOn: 'operator',
        match: /\bClaude-User\b|\bClaude-Web\b/i,
    },
    {
        product: 'ChatGPT-User',
        kind: 'assistant',
        runsOn: 'operator',
        match: /\bChatGPT-User\//i,
    },
    {
        product: 'Perplexity-User',
        kind: 'assistant',
        runsOn: 'operator',
        match: /\bPerplexity-?User\//i,
    },
];

/**
 * Generic HTTP clients. These never name the product that spawned them: Codex
 * shells out to `curl`, Cline and Junie do the same, Windsurf uses `colly`.
 */
const HTTP_CLIENTS: Array<[string, RegExp]> = [
    ['curl', /^curl\//],
    ['axios', /^axios\//],
    ['got', /^got\b/],
    ['Go-http-client', /^Go-http-client\//],
    ['python-requests', /^python-requests\//],
    ['python-httpx', /^python-httpx\//],
    ['node', /^(?:node|undici|node-fetch)\b/],
    ['Bun', /^Bun\//],
    ['Deno', /^Deno\//],
    ['Wget', /^Wget\//],
    ['reqwest', /^reqwest\//],
    ['okhttp', /^okhttp\//],
    ['colly', /^colly\b/],
    ['PowerShell', /PowerShell\//],
];

/** Headers a browser navigation always carries. Absence is evidence, not proof. */
const BROWSER_MARKERS = ['sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-ch-ua', 'accept-language'];

function toHeaderMap(headers: AssessRequestInput['headers']): Record<string, string> | null {
    if (!headers) return null;

    let source: Record<string, string | string[] | undefined>;
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
        source = Object.fromEntries(headers.entries());
    } else {
        source = headers as Record<string, string | string[] | undefined>;
    }

    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(source)) {
        out[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    }
    return out;
}

interface MediaRange {
    type: string;
    q: number;
    index: number;
}

function parseAccept(accept: string): MediaRange[] {
    return accept
        .split(',')
        .map((part, index) => {
            const [type, ...params] = part.trim().toLowerCase().split(';');
            const q = params.find(param => param.trim().startsWith('q='));
            const weight = q ? Number(q.trim().slice(2)) : 1;
            return { type: type.trim(), q: Number.isFinite(weight) ? weight : 0, index };
        })
        .filter(range => range.type !== '' && range.q > 0);
}

/**
 * True when the request asks for markdown ahead of HTML.
 *
 * Claude Code sends markdown then HTML then a wildcard, with no q-values, so
 * equal weights are broken by position: browsers and curl never put markdown
 * first.
 */
function prefersMarkdown(accept: string | undefined): boolean {
    if (!accept) return false;

    const ranges = parseAccept(accept);
    const markdown = ranges.find(range => range.type === 'text/markdown' || range.type === 'text/x-markdown');
    if (!markdown) return false;

    const html = ranges.find(range => range.type === 'text/html');
    if (!html) return true;

    return markdown.q > html.q || (markdown.q === html.q && markdown.index < html.index);
}

/**
 * Assesses a single inbound request on the server.
 *
 * Call this from a Worker, proxy or Node handler before serving HTML: it is the
 * only place where non-browser fetch clients are observable.
 */
export function assessRequest(input: AssessRequestInput = {}): RequestAssessment {
    const userAgent = (input.userAgent ?? '').trim();
    const headers = toHeaderMap(input.headers);
    const markdown = prefersMarkdown(headers?.accept);

    const empty: RequestAssessment = {
        verdict: 'unknown',
        confidence: 0,
        product: null,
        kind: null,
        runsOn: null,
        signals: [],
    };

    if (!userAgent && !markdown) return empty;

    const declared = DECLARED_CLIENTS.find(client => client.match.test(userAgent));
    if (declared) {
        const signals = [`request:user-agent:${declared.product.toLowerCase().replace(/\s+/g, '-')}`];
        if (markdown) signals.push('request:accept:markdown-first');

        return {
            verdict: declared.kind === 'assistant' ? 'assistant' : 'agent',
            // The user agent is a claim, so it never scores as proof; agreeing
            // content negotiation raises it.
            confidence: markdown ? 0.9 : 0.75,
            declaredBy: 'user-agent',
            product: declared.product,
            kind: declared.kind,
            runsOn: declared.runsOn,
            signals,
        };
    }

    if (markdown) {
        return {
            verdict: 'agent',
            confidence: 0.75,
            product: null,
            kind: null,
            runsOn: null,
            signals: ['request:accept:markdown-first'],
        };
    }

    const httpClient = HTTP_CLIENTS.find(([, match]) => match.test(userAgent));
    if (httpClient) {
        return {
            verdict: 'crawler',
            confidence: 0.6,
            product: null,
            kind: 'http-client',
            runsOn: null,
            signals: [`request:user-agent:http-client:${httpClient[0]}`],
        };
    }

    if (isbot(userAgent)) {
        return {
            verdict: 'crawler',
            confidence: 0.5,
            declaredBy: 'user-agent',
            product: null,
            kind: null,
            runsOn: null,
            signals: ['declared:user-agent:isbot'],
        };
    }

    // A browser-shaped user agent over headers that carry no browser marker.
    // Absence is weak evidence and proxies strip these headers, so it weakens
    // the human verdict instead of promoting a bot one.
    const noBrowserMarkers = headers !== null
        && headers.accept !== undefined
        && !BROWSER_MARKERS.some(marker => headers[marker] !== undefined);

    return {
        verdict: 'human',
        confidence: noBrowserMarkers ? 0.4 : 0.5,
        product: null,
        kind: null,
        runsOn: null,
        signals: noBrowserMarkers ? ['request:headers:no-browser-markers'] : [],
    };
}
