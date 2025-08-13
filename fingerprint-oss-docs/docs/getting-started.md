---
title: Getting Started
description: Quick start guide for fingerprint-oss
---

# Getting Started with fingerprint-oss

This guide will help you quickly integrate the fingerprint-oss library into your project.

## Installation

### Using npm

```bash
npm install fingerprint-oss
```

### Using yarn

```bash
yarn add fingerprint-oss
```

### Using a CDN

```html
<script src="https://unpkg.com/fingerprint-oss/dist/fingerprint-oss.umd.min.js"></script>
<script>
  // Available as window.FingerprintOSS
  const fingerprint = FingerprintOSS.userInfo();
</script>
```

## Basic Usage

### Importing the Library

```javascript
// ES Modules
import userInfo from 'fingerprint-oss';

// CommonJS
const { userInfo } = require('fingerprint-oss');
```

### Basic Example

```javascript
import userInfo from 'fingerprint-oss';

async function getFingerprint() {
  try {
    const data = await userInfo({
      transparency: true,  // Log data collection to console
      message: 'We use this data to improve your experience'  // GDPR notice
    });
    
    console.log('Device ID:', data.hash);
    console.log('Browser:', data.systemInfo.browser.name);
    console.log('OS:', data.systemInfo.os.name);
    
    return data;
  } catch (error) {
    console.error('Error collecting fingerprint:', error);
    throw error;
  }
}

getFingerprint();
```

## Configuration Options

You can customize the behavior of fingerprint-oss using the following options:

```javascript
const config = {
  // Enable console logging of data collection activities
  transparency: false,
  
  // Custom message for GDPR compliance
  message: '',
  
  // Custom geolocation endpoint
  geoEndpoint: 'https://fingerprint-proxy.gossorg.in/geoip',
  
  // Timeout for geolocation requests (in milliseconds)
  timeout: 5000
};

const data = await userInfo(config);
```

## React Integration

Here's how to use fingerprint-oss in a React application:

1. Create a custom hook:

```jsx
// useFingerprint.js
import { useEffect, useState } from 'react';
import userInfo from 'fingerprint-oss';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        const data = await userInfo({
          transparency: process.env.NODE_ENV === 'development'
        });
        setFingerprint(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { fingerprint, loading, error };
}
```

2. Use the hook in your components:

```jsx
import { useFingerprint } from './useFingerprint';

function App() {
  const { fingerprint, loading, error } = useFingerprint();

  if (loading) return <div>Loading device information...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Device Information</h1>
      <p>Device ID: {fingerprint.hash}</p>
      <p>Browser: {fingerprint.systemInfo.browser.name} {fingerprint.systemInfo.browser.version}</p>
      <p>OS: {fingerprint.systemInfo.os.name} {fingerprint.systemInfo.os.version}</p>
      <p>Confidence: {Math.round(fingerprint.confidence * 100)}%</p>
    </div>
  );
}

export default App;
```

## Server-Side Usage (Node.js)

```javascript
const { userInfo } = require('fingerprint-oss/node');

// Note: Some features like WebGL and Canvas won't be available in Node.js
async function getServerFingerprint(req) {
  const userAgent = req.headers['user-agent'];
  const clientIp = req.ip;
  
  const data = await userInfo({
    userAgent,
    clientIp,
    // Other options...
  });
  
  return data;
}
```

## Handling Privacy and Consent

For GDPR compliance, you should:

1. Inform users about data collection
2. Get explicit consent when required
3. Provide an opt-out mechanism

Example consent implementation:

```javascript
// Check for existing consent
const hasConsent = localStorage.getItem('fingerprint-consent') === 'true';

// Function to request consent
function requestConsent() {
  if (confirm('We use device fingerprinting to improve security. Allow this feature?')) {
    localStorage.setItem('fingerprint-consent', 'true');
    return true;
  }
  return false;
}

// Usage
if (hasConsent || requestConsent()) {
  const data = await userInfo({
    transparency: true,
    message: 'Collecting device information for security purposes.'
  });
  // Use the fingerprint data
}
```

## Next Steps

- Explore the [API Reference](/docs/api/reference) for detailed documentation
- Learn about [fingerprinting techniques](/docs/guides/fingerprinting-techniques)
- Check the [architecture](/docs/architecture/overview) for a deeper understanding
- Review the [GitHub repository](https://github.com/your-org/fingerprint-oss) for examples and source code
