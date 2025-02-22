# Flexr

> A self-hosted platform that automates containerization and deployment of Node.js applications with automatic SSL, DNS management, and container orchestration.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-v18%2B-green)](https://nodejs.org)

## Overview

Flexr simplifies application deployment by automating container builds, SSL certification, DNS configuration, and deployment monitoring. It integrates with GitHub for seamless deployment workflows and provides real-time deployment status updates.

## Features

- **Automated Deployment Pipeline**
  - Container build automation with Podman
  - Automatic SSL certificate generation via Certbot
  - Dynamic DNS configuration through Cloudflare
  - NGINX reverse proxy setup

- **Monitoring & Management**
  - Real-time deployment status
  - Container health monitoring
  - Resource usage tracking
  - Deployment history

- **Security**
  - Auth0 integration for authentication
  - Automatic SSL/TLS certification
  - Secure proxy configuration
  - Container isolation

## Prerequisites

- Node.js (v18+) & TypeScript
- Podman
- PostgreSQL
- Redis
- NGINX
- Auth0 Account
- Cloudflare Account

## Environment Variables

```bash
# Auth0 Configuration
SECRET=your_auth0_secret
BASEURL=your_base_url
CLIENTID=your_auth0_client_id
ISSUERBASEURL=your_auth0_issuer_url

# Cloudflare Configuration
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_EMAIL=your_email
CLOUDFLARE_GLOBAL_TOKEN=your_api_token

# Certbot Configuration
CERTBOT_EMAIL=your_email
```

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/IntegerAlex/flexr.git
   cd flexr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build TypeScript:
   ```bash
   npm run build
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## API Reference

### Deployment Endpoints

```typescript
POST /v1/runContainer
{
  "userName": "string",
  "projectName": "string",
  "repoLink": "string",
  "entryPoint": "string",
  "buildCommand": "string",
  "runCommand": "string"
}
```

### Management Endpoints

- `GET /v1/health` - System health check
- `GET /v1/repositories` - List GitHub repositories
- `GET /v1/profile` - User profile information
- `GET /htmx/deployments` - Deployment history

## Architecture

- **Frontend**: HTMX + Vanilla JavaScript
- **Backend**: TypeScript & Express.js
- **Database**: PostgreSQL + Redis
- **Container**: Podman
- **Proxy**: NGINX
- **DNS**: Cloudflare API
- **SSL**: Certbot

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

---
Made with ❤️ by Akshat Kotpalliwar (alias IntegerAlex on GitHub) 