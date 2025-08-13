---
title: Architecture Overview
description: High-level architecture and design of the fingerprint-oss library
---

# System Architecture

## Core Architecture

The fingerprint-oss library follows a modular, client-side architecture with optional external service integration. The system is designed around a central orchestration function that coordinates parallel data collection from multiple sources, applies confidence scoring, and generates deterministic output.

### High-Level System Flow

```mermaid
flowchart TD
    A[Client Application] -->|userInfo()| B[Data Collection]
    B --> C[System Info Collection]
    B --> D[Geolocation Lookup]
    C --> E[Processing]
    D --> E
    E --> F[Confidence Scoring]
    F --> G[Output Generation]
    G --> H[JSON Response]
```

## Main Components

### 1. Core Entry Point (`src/index.ts`)
- `userInfo()`: Main function that orchestrates the fingerprinting process
- `getSystemInfo()`: Collects system and browser information
- `fetchGeolocationInfo()`: Retrieves geolocation data
- `calculateCombinedConfidence()`: Computes confidence scores
- `generateJSON()`: Formats the final output

### 2. Data Collection Layer
- **System Information**: Browser, OS, and hardware details
- **Fingerprinting Modules**: Canvas, WebGL, Audio, and Math constants
- **Privacy Detection**: Incognito mode, ad blockers, VPN detection
- **Network Analysis**: Geolocation and network characteristics

### 3. Processing Layer
- Data normalization and validation
- Confidence scoring
- Bot detection and risk assessment

### 4. Output Layer
- JSON generation
- Hash generation for device identification
- Error handling and fallbacks

## External Integrations

- **MaxMind GeoIP2 Database**: For IP geolocation data
- **Proxy Service**: For secure geolocation lookups
- **Browser APIs**: For system information collection

## Error Handling

The system implements comprehensive error handling with graceful degradation:
- Fallback mechanisms when external services are unavailable
- Default values for missing or restricted data
- Clear error reporting and logging

## Performance Considerations

- Parallel data collection for better performance
- Lazy loading of non-essential components
- Efficient data structures and algorithms
- Minimal external dependencies

## Security Considerations

- Client-side processing for sensitive data
- Secure communication with external services
- No persistent storage of personal data
- Transparent data collection practices
