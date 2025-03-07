# Fingerprint OSS

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)
[![npm version](https://img.shields.io/npm/v/fingerprint-oss.svg)](https://www.npmjs.com/package/fingerprint-oss)
[![GitHub stars](https://img.shields.io/github/stars/IntegerAlex/fingerprint-oss.svg)](https://github.com/IntegerAlex/fingerprint-oss/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/fingerprint-oss.svg)](https://www.npmjs.com/package/fingerprint-oss)
[![GitHub issues](https://img.shields.io/github/issues/IntegerAlex/fingerprint-oss.svg)](https://github.com/IntegerAlex/fingerprint-oss/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/IntegerAlex/fingerprint-oss/pulls)

A free and open source alternative to commercial fingerprinting services like FingerprintJS.

## About

Fingerprint OSS is a fork of user-info-logger, a simple client-side fingerprinting library that logs user information. Unlike commercial alternatives that are "source available" but not truly open, Fingerprint OSS is released under the GPL-3.0 license, making it fully open source and free to use.

## DEMO 

- [LIVE](https://fingerprint-oss-demo.vercel.app/)
- [DEMO REPO](https://github.com/IntegerAlex/fingerprint-oss-demo)

## Features

- Lightweight browser fingerprinting
- Privacy-focused design
- No external dependencies
- Easy integration with any web application
- 100% client-side operation
- Comprehensive user data collection

## Installation

Install via npm:

```bash
npm install fingerprint-oss
```

## Usage

Basic usage:

```javascript
const { userInfo } = require('fingerprint-oss');
const data = userInfo();
```

The `userInfo()` function returns an object containing various data points about the user's browser, system, and environment, which can be used for:

- Fraud detection
- User identification
- Analytics
- Security enhancements

## Data Collected

Fingerprint OSS can collect information about:

- Browser type and version
- Operating system
- Screen resolution
- Installed plugins
- Language settings
- Time zone
- Hardware information
- Canvas fingerprinting
- WebGL capabilities
- And more...

## Demo

A live demo is available at the GitHub Pages site where you can see the type of information collected by the library.

## Project Status

This project is currently under active development.

## License

GPL-3.0 - See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open issues on our GitHub repository.

## Acknowledgements

This project is a fork of user-info-logger, with enhancements and improvements for better performance and features.

