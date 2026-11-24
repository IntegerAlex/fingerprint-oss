# FAQ

**Q: What is Fingerprint OSS?**  
A: Fingerprint OSS is a comprehensive JavaScript library for device fingerprinting and system information collection. It's a free  and open source alternative to commercial solutions like FingerprintJS, released under the LGPL-3.0 license.

**Q: How do I install it?**  
A: Install via npm using the latest version
```bash
npm install fingerprint-oss@latest
```

**Q: What are the system requirements?**  
A: The package requires Node.js version 16.0.0 or higher

**Q: How do I use it?**  
A: Basic usage involves importing and calling the userInfo function
```bash
import userInfo from 'fingerprint-oss';  
const data = await userInfo();
```
**Q: What data does it collect?**

A: The library collects comprehensive information including :
- Browser type and version, from Client Hints and feature probes with Bowser's UA parsing as the fallback
- Operating system and hardware information
- Canvas and WebGL fingerprinting
- VPN, incognito mode, and AdBlocker detection
- Bot detection capabilities

**Q: Is it GDPR compliant?**  
A: Yes, the library includes GDPR compliance support through transparency configuration options. You can enable transparency mode and custom messaging for data collection notifications.

**Q: What's the current version?**  
A: 0.11.0. It ships the dual-package fix (`require` and `import` both work), moves browser detection to Bowser 2.15.1 as a normal dependency, collects signals in parallel, and adds `agentAssessment` with evasion handling. See the [CHANGELOG](https://github.com/IntegerAlex/fingerprint-oss/blob/main/CHANGELOG.md).

**Q: Does it detect AI agents and automation?**  
A: `systemInfo.agentAssessment` fuses three sources: BotD (browser-automation evidence), isbot (a User-Agent that declares itself a crawler or agent), and a curated list for AI browser agents such as ChatGPT, Gemini, Copilot, Perplexity, Operator and Comet. Verdicts are `human`, `crawler`, `agent`, `assistant`, `automation` or `unknown`, with named evidence in `signals`. Declared verdicts are self-reported and capped at 0.5–0.6 confidence; `human` at 0.5 means "no evidence", not proof. See the [API reference](./api/reference.md#agent-assessment).

**Q: How does telemetry export work?**  
A: It doesn't any more. The `telemetry` option and the `Telemetry` / `withTelemetry` exports are no-ops since 0.10.1 and will be removed in a future major release. Calls are accepted for backward compatibility and do nothing; no traces leave the browser.

**Q: What are the ethical considerations?**  
A: The library includes ethical guidelines emphasizing transparency, user privacy protection, and compliance with privacy regulations. The project also includes a non-binding ethical contribution notice for substantial usage scenarios.
