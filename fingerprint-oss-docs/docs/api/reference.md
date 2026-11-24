---
title: API Reference
description: Comprehensive reference for the fingerprint-oss API, detailing the output structure, usage examples, and ethical considerations.
---

# API Reference

The `userInfo()` function returns a comprehensive object containing various data points about the user's system, browser, and environment. Here's a detailed breakdown of the output structure:

## Output Structure

### Confidence Assessment

```typescript
confidenceAssessment: {
  system: {
    score: number;          // 0-1 confidence score
    rating: string;         // Confidence rating (e.g., "Medium-High Confidence")
    description: string;    // Detailed description of confidence level
    reliability: string;    // Reliability assessment
    level: string;         // Confidence level category
    factors: string;       // Factors affecting confidence
  },
  combined: {
    score: number;         // Overall confidence score
    rating: string;        // Combined confidence rating
    description: string;   // Description of combined confidence
    reliability: string;   // Overall reliability assessment
    level: string;        // Combined confidence level
    factors: string;      // Factors affecting combined confidence
  }
}
```

### Geolocation Information

```typescript
geolocation: {
  vpnStatus: {
    vpn: {
      status: boolean;     // Whether VPN is detected
      probability: number; // Probability of VPN usage (0-1)
    }
  },
  ip: string;             // IP address
  city: string;           // City name
  region: {
    isoCode: string;      // Region ISO code
    name: string;         // Region name
  },
  country: {
    isoCode: string;      // Country ISO code
    name: string;         // Country name
  },
  continent: {
    code: string;         // Continent code
    name: string;         // Continent name
  },
  location: {
    accuracyRadius: number; // Location accuracy radius in kilometers
    latitude: number;      // Latitude
    longitude: number;     // Longitude
    timeZone: string;      // Timezone
  },
  traits: {
    isAnonymous: boolean;      // Whether the IP is anonymous
    isAnonymousProxy: boolean; // Whether using anonymous proxy
    isAnonymousVpn: boolean;   // Whether using anonymous VPN
    network: string;           // Network information
  }
}
```

### System Information

```typescript
systemInfo: {
  incognito: {
    isPrivate: boolean;    // Whether in private/incognito mode
    browserName: string;   // Browser name
  },
  adBlocker: {
    isBrave: boolean;     // Whether using Brave browser
    adBlocker: boolean;   // Whether ad blocker is detected
  },
  browser: {
    name?: string;        // Browser name (e.g., "Chrome", "Firefox", "Safari")
    version?: string;     // Browser version (e.g., "120.0.0.0")
  },
  userAgent: string;      // User agent string
  platform: string;       // Platform information
  languages: string[];    // Preferred languages
  cookiesEnabled: boolean; // Whether cookies are enabled
  doNotTrack: boolean | null; // Do Not Track setting
  screenResolution: [number, number]; // Screen resolution [width, height]
  colorDepth: number;     // Color depth
  colorGamut: string;     // Color gamut
  touchSupport: {
    maxTouchPoints: number; // Maximum touch points
    touchEvent: boolean;    // Touch event support
    touchStart: boolean;    // Touch start support
  },
  hardwareConcurrency: number; // Number of CPU cores
  deviceMemory: number;    // Device memory in GB
  os: {
    os: string;           // Operating system
    version: string;      // OS version
  },
  audio: null | object;   // Audio fingerprint
  localStorage: boolean;  // Local storage support
  sessionStorage: boolean; // Session storage support
  indexedDB: boolean;     // IndexedDB support
  webGL: {
    vendor: string;       // WebGL vendor
    renderer: string;     // WebGL renderer
  },
  canvas: {
    winding: boolean;     // Canvas winding
    geometry: string;     // Canvas geometry fingerprint
    text: string;         // Canvas text fingerprint
  },
  plugins: Array<{
    name: string;         // Plugin name
    description: string;  // Plugin description
    mimeTypes: Array<{
      type: string;       // MIME type
      suffixes: string;   // File suffixes
    }>
  }>,
  timezone: string;       // Timezone
  vendor: string;         // Browser vendor
  vendorFlavors: string[]; // Browser flavors
  mathConstants: {
    acos: number;         // Math.acos result
    acosh: number;        // Math.acosh result
    asinh: number;        // Math.asinh result
    atanh: number;        // Math.atanh result
    expm1: number;        // Math.expm1 result
    sinh: number;         // Math.sinh result
    cosh: number;         // Math.cosh result
    tanh: number;         // Math.tanh result
  },
  fontPreferences: {
    fonts: Array<{
      name: string;       // Font name
      width: number;      // Font width
    }>
  },
  bot: {
    isBot: boolean;       // Whether detected as bot
    signals: string[];    // Bot detection signals
    confidence: number;   // Bot detection confidence
  },
  // Added in 0.11.0. `bot` above is unchanged; prefer this for new code.
  agentAssessment?: {
    verdict: 'human' | 'crawler' | 'agent' | 'assistant' | 'automation' | 'unknown';
    confidence: number;   // 0-1; 0.5 means "no evidence", not certainty
    declaredBy?: 'user-agent'; // Set when the UA claimed the identity (unverified)
    signals: string[];    // e.g. 'automation:botd:headless_chrome',
                          //      'declared:user-agent:ai-assistant',
                          //      'automation:renderer-os-mismatch'
  },
  warnings?: FingerprintWarning[]; // Present only when a collector failed
  outputVersion?: string; // Schema version; see dist/systeminfo.schema.json
  confidenceScore: number; // Overall system confidence score
}
```

### Agent Assessment

`agentAssessment` fuses maintained open-source detectors with this library's
consistency checks. It runs in the page, so it can only see clients that
execute JavaScript; for CLI agents, see [Request-Layer Agent
Assessment](#request-layer-agent-assessment) below.

Sources:

| Layer | Source | License |
|---|---|---|
| Automation | [BotD](https://github.com/fingerprintjs/BotD) (telemetry disabled) | MIT |
| Declared identity | [isbot](https://github.com/omrilotan/isbot) | Unlicense |
| AI browser agents | Curated token list (ChatGPT, Gemini, Copilot, Perplexity, Operator, Comet) | — |
| Consistency | Prototype tamper, Client Hints/UA, renderer/OS contradictions | — |

How to read the verdict:

- `automation` (0.8) — automated browser. 0.9 with
  `automation:spoofed-declaration` when a crawler UA appears inside an
  automated browser; crawlers do not execute JavaScript.
- `crawler` / `agent` / `assistant` (0.5–0.6) — **self-declared** by the UA,
  unverified. A crawler is not automatically hostile.
- `human` (0.5) — no automation evidence. A stealth plugin that hides
  `navigator.webdriver` and rewrites its UA is caught instead by two
  contradictions: a core-count mismatch (reports 4, measures 8) and a
  renderer/OS mismatch (Windows UA, macOS GPU strings).
- `unknown` — no User-Agent available (e.g. non-browser runtime).

```typescript
import { getSystemInfo } from 'fingerprint-oss';

const { agentAssessment } = await getSystemInfo();
if (agentAssessment?.verdict === 'automation' && agentAssessment.confidence >= 0.8) {
  // require a challenge before accepting the request
}
```

The generated JSON Schema for `SystemInfo` ships with the package as
`dist/systeminfo.schema.json` (importable via
`fingerprint-oss/dist/systeminfo.schema.json`).

### Request-Layer Agent Assessment

A CLI agent never runs the page. It fetches with its own HTTP client, receives
bytes, and stops, so the bundle that produces `agentAssessment` never loads.
OpenCode, Claude Code, Cursor, Codex and Gemini CLI all work this way.

`assessRequest()` reads the request instead. Call it in a Worker, a proxy or a
Node handler, before any HTML is served:

```typescript
import { assessRequest } from 'fingerprint-oss';

export default {
  async fetch(request: Request) {
    const assessment = assessRequest({
      userAgent: request.headers.get('user-agent'),
      headers: request.headers,
    });

    if (assessment.verdict === 'agent' && assessment.confidence >= 0.8) {
      // serve the agent-friendly representation, or gate on it
    }
  },
};
```

```typescript
assessRequest(input: {
  userAgent?: string | null;
  /** Plain object or a Headers instance. */
  headers?: Record<string, string | string[] | undefined> | Headers | null;
}): RequestAssessment

interface RequestAssessment {
  verdict: 'human' | 'crawler' | 'agent' | 'assistant' | 'automation' | 'unknown';
  confidence: number;
  product: string | null;   // 'OpenCode', 'Claude Code', 'Exa', ... or null
  kind: 'coding' | 'assistant' | 'browser' | 'http-client' | null;
  runsOn: 'user' | 'operator' | null;
  declaredBy?: 'user-agent';
  signals: string[];
}
```

Two checks, most specific first:

| Check | What it covers | Confidence |
|---|---|---|
| Self-declared user agent | `OpenCode-User/1.0` (and its bare `opencode` Cloudflare fallback), `claude-code/<version>` inside `Claude-User (...)`, `Cursor/`, `qodercli/`, `Augment-WebFetch/`, `ZCode-WebFetch/`, `Google-Jetski-Antigravity`, `GoogleAgent-URLContext`, `GitHubCopilot*`, `ExaUser`, `Claude-User`, `ChatGPT-User`, `Perplexity-User`, `KiroServer/` | 0.75; 0.9 when the `Accept` header agrees |
| `Accept` negotiation | any client that ranks `text/markdown` or `text/x-markdown` above `text/html`. Claude Code ties both at q=1 and relies on header order, so position breaks the tie. No browser does this. | 0.75, with `product: null` |

Generic HTTP clients (`curl`, `axios`, `got`, `Go-http-client`,
`python-requests`, `node`, `Bun`, `Wget`, `reqwest`, `okhttp`, `colly`, …)
return `crawler` with `kind: 'http-client'` and no product.

How to read a request verdict:

- `agent` / `assistant` (0.75–0.9) — the request named a product, or asked for
  markdown. 0.9 means both. Still a claim, not proof: a user agent is
  trivially forged.
- `crawler` (0.5–0.6) — a generic HTTP client, or a UA isbot already knows.
  This says "not a browser", not "hostile".
- `human` (0.5, or 0.4 with `request:headers:no-browser-markers`) — no
  declaration and no markdown preference. A browser-shaped UA whose headers
  carry no `Sec-Fetch-*`, `Sec-CH-UA` or `Accept-Language` lowers confidence
  rather than flipping the verdict, because proxies strip those headers.
- `unknown` — no user agent and no headers.

What it cannot tell you:

- **Proxied fetches.** Cursor's web fetch runs on Exa and arrives as
  `ExaUser`, so the answer is `assistant` / `Exa` — whoever made the request,
  not the product the user typed into.
- **Operator-side search.** Codex's web search goes to OpenAI's API and may
  never reach your origin. When Codex does fetch directly, it shells out to
  `curl`, so the origin sees curl.
- **Spoofing.** Nothing here verifies a declaration. `product` is what the
  request claims.

`product: null` is a result, not a gap in the dataset.

### Hash

```typescript
hash: string; // Unique device identifier hash
```

## Usage Examples

### Basic Usage

```javascript
import userInfo from 'fingerprint-oss';

const data = await userInfo();
console.log(data.hash); // Get unique device identifier
console.log(data.systemInfo.os); // Get OS information
console.log(data.systemInfo.browser); // Get browser information { name: "Chrome", version: "120.0.0.0" }
```

### With GDPR Compliance

```javascript
import userInfo from 'fingerprint-oss';

const config = {
  transparency: true,
  message: 'We collect device information to improve your experience'
};

const data = await userInfo(config);
```

## Ethical Considerations

When using this library, please consider the following ethical guidelines:

1.  **Transparency**: Always inform users about data collection
2.  **Purpose**: Only collect data necessary for your application
3.  **Consent**: Obtain proper consent before collecting data
4.  **Privacy**: Handle collected data securely and responsibly
5.  **Compliance**: Follow relevant privacy laws and regulations

For more information about ethical usage, please refer to our [Ethical Contribution Notice](https://github.com/IntegerAlex/fingerprint-oss/blob/main/NOTICE.md).
