# Fingerprint OSS

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)
[![npm version](https://img.shields.io/npm/v/fingerprint-oss.svg)](https://www.npmjs.com/package/fingerprint-oss)
[![GitHub stars](https://img.shields.io/github/stars/IntegerAlex/fingerprint-oss.svg)](https://github.com/IntegerAlex/fingerprint-oss/stargazers)
[![npm downloads](https://img.shields.io/npm/dy/fingerprint-oss.svg)](https://www.npmjs.com/package/fingerprint-oss)
[![GitHub issues](https://img.shields.io/github/issues/IntegerAlex/fingerprint-oss.svg)](https://github.com/IntegerAlex/fingerprint-oss/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/IntegerAlex/fingerprint-oss/pulls)
<img src="/logo.png" alt="logo" width="200" height="200" />
>A free and open source fingerprinting services unlike FingerprintJS.

## About

Fingerprint OSS is a fork of user-info-logger, a simple client-side fingerprinting library that logs user information. Unlike commercial alternatives that are "source available" but not truly open, Fingerprint OSS is released under the GPL-3.0 license, making it fully open source and free to use.

## DEMO 

- [LIVE](https://fingerprint-oss-demo.vercel.app/)
- [DEMO REPO](https://github.com/IntegerAlex/fingerprint-oss-demo)

## Features

- Lightweight browser fingerprinting
- Easy integration with any web application
- 100% client-side operation ( Except the GeoLocation API )
- Comprehensive user data collection

## Installation

Install via npm:

```bash
npm install fingerprint-oss@latest
```

## Usage

Basic usage:

```javascript
const { userInfo } = require('fingerprint-oss');
const data = await userInfo();
```

## Config for GDPR Compliance/Others 

```javascript
const config = {
    transparancy: true,
    message: 'Test Message',
}
const data = userInfo(config);
```
 - transparancy: If true, it will log a message on console about the data collection.
 - message: The message to be logged on console.

The `userInfo()` function returns an object containing various data points about the user's browser, system, and environment, which can be used for:

- Fraud detection
- User identification
- Analytics
- Security enhancements

## Wiki

 - [DeepWiki](https://deepwiki.com/IntegerAlex/fingerprint-oss)

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

## Ethical Contribution Notice

[NOTICE](./NOTICE.md)

## Demo

You can see a live demo of Fingerprint OSS in action [here](https://fingerprint-oss-demo.vercel.app/).

## Project Status

This project is currently under active development.

## CHANGELOG

- [CHANGELOG](./CHANGELOG.md)

## License

GPL-3.0 - See [LICENSE](./LICENSE.md) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open issues on our GitHub repository.

## Acknowledgements

This project is a fork of user-info-logger, with enhancements and improvements for better performance and features.

## GDPR Compliance

Fingerprint OSS is designed with GDPR compliance in mind. The library provides options to ensure transparency and user consent for data collection. You can configure the library to display a message to users about the data being collected and ensure that the data collection process is transparent.

To enable GDPR compliance, use the following configuration:

```javascript
const config = {
    transparency: true,
    message: 'We collect data to enhance your experience. By using our service, you consent to data collection.',
}
const data = userInfo(config);
```

By setting `transparency` to `true` and providing a `message`, you can inform users about the data collection process and obtain their consent.

## Demo

You can see a live demo of Fingerprint OSS in action [here](https://fingerprint-oss-demo.vercel.app/).

## Project Status

This project is currently under active development.

## CHANGELOG

- [CHANGELOG](./CHANGELOG.md)

## License

LGPLv3 - See [LICENSE](./LICENSE.md) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open issues on our GitHub repository.

## Acknowledgements

This project is a fork of user-info-logger, with enhancements and improvements for better performance and features.
