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
 * Agent and automation assessment.
 *
 * Rather than hand-rolling a bot taxonomy, this fuses maintained open-source
 * sources with one small curated token list:
 *
 *  - BotD (MIT, FingerprintJS): browser-automation detection (headless
 *    Chromium/Firefox, Selenium, Playwright, PhantomJS, Nightmare, Electron,
 *    SlimerJS, WebDriver). Only its verdict is used.
 *  - isbot (Unlicense): declared crawler/bot classification from the
 *    User-Agent, including AI crawler-style agents such as Claude Code.
 *  - A short token list for AI *browser* agents and assistants (ChatGPT,
 *    Gemini, Copilot, Perplexity, Operator, Comet...). isbot does not cover
 *    these because they present as ordinary browsers.
 *
 * The sources answer different questions. isbot tells you what the UA claims;
 * BotD tells you whether the browser is actually automated. When both fire, the
 * declaration is being spoofed — the signal that matters most.
 *
 * Known ceiling: a user-driven browser agent with a clean UA and no automation
 * artifacts is indistinguishable from a human client-side. Such a visitor is
 * reported as `human` with confidence 0.5 — absence of evidence, not proof.
 */

import { load } from '@fingerprintjs/botd';
import { findBotMatch, isbot } from 'isbot';
import type { AgentAssessment } from './types.js';

/** BotD's `load()` collects once; reuse the result across calls. */
let automationPromise: Promise<AutomationEvidence | null> | null = null;

interface AutomationEvidence {
    bot: boolean;
    kind?: string;
}

/**
 * Runs BotD with its installation-statistics request disabled.
 *
 * `load()` defaults to `monitoring: true`, which sends a sampled request to
 * openfpcdn.io. This project is 100% client-side (see NOTICE.md), so telemetry
 * is switched off explicitly rather than relying on the default.
 */
function detectAutomation(): Promise<AutomationEvidence | null> {
    if (typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    automationPromise ??= (async () => {
        try {
            const botd = await load({ monitoring: false });
            const result = botd.detect();
            return result.bot
                ? { bot: true, kind: String(result.botKind) }
                : { bot: false };
        } catch {
            // A blocked prototype or missing API means "no evidence", not a
            // failed fingerprint: fall back to the declared layer.
            return null;
        }
    })();

    return automationPromise;
}

/** User-driven browser agents. Order matters only for readability. */
const AI_AGENT_TOKENS = /operator|computer[-\s]?use|browser[-\s]?use|claude-code|manus|comet|atlas/i;

/** User-driven AI assistants embedded in a browser. */
const AI_ASSISTANT_TOKENS = /chatgpt|gemini|copilot|perplexity|claude-in-chrome|claude\/|poe\b/i;

export type DeclaredAiKind = 'agent' | 'assistant' | null;

/** Classifies the UA against the curated AI token lists. */
export function declaredAiKind(userAgent: string): DeclaredAiKind {
    if (AI_AGENT_TOKENS.test(userAgent)) return 'agent';
    if (AI_ASSISTANT_TOKENS.test(userAgent)) return 'assistant';
    return null;
}

export interface ClassifyAgentInput {
    userAgent: string;
    /** Result of `isbot(userAgent)` — a declared crawler/bot. */
    declared: boolean;
    /** Matched isbot pattern, when declared. */
    declaredMatch?: string | null;
    /** Result of `declaredAiKind(userAgent)`. */
    aiKind?: DeclaredAiKind;
    /** Result of the BotD automation probe, when it could run. */
    automation?: AutomationEvidence | null;
}

/**
 * Pure verdict fusion, exported so the weighting can be tested without a
 * browser. Every branch returns named signals: consumers should act on those,
 * not on the verdict alone.
 */
export function classifyAgent(input: ClassifyAgentInput): AgentAssessment {
    const { userAgent, declared, declaredMatch, aiKind = null, automation } = input;
    const signals: string[] = [];

    if (!userAgent) {
        return { verdict: 'unknown', confidence: 0, signals: ['evidence:no-user-agent'] };
    }

    if (automation?.bot) {
        signals.push(`automation:botd:${automation.kind ?? 'unknown'}`);
    }

    if (declared && declaredMatch) {
        // Patterns are regex sources; keep the signal short and readable.
        signals.push(`declared:user-agent:isbot:${declaredMatch.slice(0, 48)}`);
    }
    if (aiKind) {
        signals.push(`declared:user-agent:ai-${aiKind}`);
    }

    // A declaration that disagrees with the engine is what a spoofed UA looks
    // like: something is claiming an identity it does not have.
    if (automation?.bot && (declared || aiKind)) {
        signals.push('automation:spoofed-declaration');
        return { verdict: 'automation', confidence: 0.9, declaredBy: 'user-agent', signals };
    }

    if (automation?.bot) {
        return { verdict: 'automation', confidence: 0.8, signals };
    }

    if (aiKind === 'agent') {
        return { verdict: 'agent', confidence: 0.6, declaredBy: 'user-agent', signals };
    }
    if (aiKind === 'assistant') {
        return { verdict: 'assistant', confidence: 0.55, declaredBy: 'user-agent', signals };
    }
    if (declared) {
        return { verdict: 'crawler', confidence: 0.5, declaredBy: 'user-agent', signals };
    }

    // No automation evidence and no declaration. Absence of evidence, not
    // proof: 0.5 keeps callers from treating the verdict as certainty.
    return { verdict: 'human', confidence: 0.5, signals };
}

/**
 * Assesses whether the current visitor is a human, a declared crawler/agent, or
 * an automated browser that does not say so.
 */
export async function assessAgent(): Promise<AgentAssessment> {
    const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    if (!userAgent) {
        return { verdict: 'unknown', confidence: 0, signals: ['evidence:no-user-agent'] };
    }

    let declared = false;
    let declaredMatch: string | null = null;
    try {
        declared = isbot(userAgent);
        declaredMatch = declared ? findBotMatch(userAgent) : null;
    } catch {
        // A hostile UA string must not break the assessment.
        declared = false;
    }

    const automation = await detectAutomation();

    return classifyAgent({
        userAgent,
        declared,
        declaredMatch,
        aiKind: declaredAiKind(userAgent),
        automation,
    });
}
