/**
 * Detects Brave browser 
 * @returns {Promise<boolean>} true if Brave browser is detected, false otherwise
 */
async function isBraveBrowser(): Promise<boolean> {
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      return await navigator.brave.isBrave();
    } catch {
      // If an error occurs, fallback to user agent check
    }
  }
  // Fallback: check the user agent (not always reliable)
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('brave');
}

/**
 * Detects Brave browser using `navigator.userAgentData`
 * @returns {Promise<boolean>} true if Brave browser is detected, false otherwise
 */
async function isBraveBrowserUAData(): Promise<boolean> {
  if (navigator.userAgentData && navigator.userAgentData.brands) {
    return navigator.userAgentData.brands.some((brand) =>
      brand.brand.toLowerCase().includes('brave')
    );
  }
  return false;
}

/**
 * Detects uBlock Origin or some other ad blocker
 * @returns {Promise<boolean>} true if uBlock Origin is detected, false otherwise
 */
 async function isUBlockActive(): Promise<boolean> {
    let result = false;
    try {
        result = await detectAdBlock();
    } catch (error) {
        console.error('Error detecting ad blocker:', error);
    }
    return result;
}

function detectAdBlock() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = './dfp_async.js'; // Must exist on your server
        script.onload = () => resolve(!document.getElementById('GTvbiUxNuhSd'));
        script.onerror = () => resolve(true);
        document.body.appendChild(script);
    });
}

// Usage example
/**
 * Detects Brave browser and uBlock Origin (or some ad blocker)
 * @returns {Promise<{ isBrave: boolean, isUBlock: boolean }>}
 */
export async function detectAdBlockers(): Promise<{ isBrave: boolean, isUBlock: boolean }> {
  // 1. Detect Brave
  const braveChecks = [
    isBraveBrowser(),       // Check navigator.brave
    isBraveBrowserUAData()  // Check userAgentData
  ];
  const [maybeBrave1, maybeBrave2] = await Promise.all(braveChecks);
  const isBrave = maybeBrave1 || maybeBrave2;

  // 2. Detect uBlock (or some ad blocker)
  const isUBlock =  await isUBlockActive();

  return { isBrave, isUBlock };
}

// Usage

