# Fingerprint OSS Demo

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://integeralex.github.io/fingerprint-oss-demo/)

This directory contains a demo application that showcases the capabilities of the Fingerprint OSS library. It provides a visual interface to see what kind of information the library can collect from a browser.
## Fingerprint-oss

[main repository](https://github.com/IntegerAlex/fingerprint-oss)

## Live Demo

You can view a live version of this demo at: [https://integeralex.github.io/fingerprint-oss-demo/](https://integeralex.github.io/fingerprint-oss-demo/)

## Features Demonstrated

- Visualization of all data points collected by Fingerprint OSS
- Clean, responsive UI for desktop and mobile devices
- Code examples showing how to integrate the library
- Copy functionality for easy code reuse

## Running Locally

To run this demo on your local machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/IntegerAlex/fingerprint-oss-demo.git
   cd fingerprint-oss-demo/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## How It Works

The demo application uses the Fingerprint OSS library to collect browser information. When you load the page, the library is called and the results are displayed in a formatted JSON object.

Key components:
- `index.html` - The main HTML file for the demo
- `src/style.css` - Styling for the demo
- `src/main.js` - JavaScript that calls the Fingerprint OSS library and displays results

## Example Output

The demo will display information including:

- Browser details (name, version, language)
- Operating system information
- Screen and window dimensions
- Hardware details where available
- Network information
- Time and timezone data
- And much more...

## Security & Privacy Notes

This demo is for educational purposes only. The Fingerprint OSS library only displays the collected information in your browser and does not transmit any data to remote servers.

All processing happens client-side, keeping your information private and secure.

## Contributing

If you'd like to improve this demo, please feel free to submit pull requests to the [main repository](https://github.com/IntegerAlex/fingerprint-oss).

## License

This demo is released under the GPL-3.0 license, the same as the main Fingerprint OSS library. 