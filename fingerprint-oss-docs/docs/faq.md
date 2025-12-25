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
- Browser type and version (enhanced detection with 98% accuracy, supports 100+ browsers)
- Operating system and hardware information
- Canvas and WebGL fingerprinting
- VPN, incognito mode, and AdBlocker detection
- Bot detection capabilities

**Q: Is it GDPR compliant?**  
A: Yes, the library includes GDPR compliance support through transparency configuration options. You can enable transparency mode and custom messaging for data collection notifications.

**Q: What's the current version?**  
A: The current version is 0.9.2, which includes enhanced browser detection with 98% accuracy using the Bowser library.

**Q: How does telemetry export work?**  
A: When telemetry is enabled, the library sends OTLP/HTTP traces to `domain/v1/traces` by default (no auth required). You can override the endpoint in your telemetry config if needed.

**Q: What are the ethical considerations?**  
A: The library includes ethical guidelines emphasizing transparency, user privacy protection, and compliance with privacy regulations. The project also includes a non-binding ethical contribution notice for substantial usage scenarios.
