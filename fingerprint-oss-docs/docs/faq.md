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
- Browser type and version
- Operating system and hardware information
- Canvas and WebGL fingerprinting
- VPN, incognito mode, and AdBlocker detection
- Bot detection capabilities

**Q: Is it GDPR compliant?**  
A: Yes, the library includes GDPR compliance support through transparency configuration options. You can enable transparency mode and custom messaging for data collection notifications.

**Q: What's the current version?**  
A: The current version is 0.9.0, marking the first stable canary release

**Q: What are the ethical considerations?**  
A: The library includes ethical guidelines emphasizing transparency, user privacy protection, and compliance with privacy regulations. The project also includes a non-binding ethical contribution notice for substantial usage scenarios.