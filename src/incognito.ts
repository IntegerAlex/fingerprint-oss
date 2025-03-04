
export async function isIncognito(): Promise<boolean> {
    // Run general checks first
    const storageAccess = await checkStorageAccess();
    const quotaLimit = await checkQuotaLimit();

    if (!storageAccess || quotaLimit) {
        return true;
    }

    // Browser-specific checks
    try {
        // Firefox detection
        if (typeof BroadcastChannel === 'undefined' && navigator.userAgent.includes('Firefox')) {
            return true;
        }

        // Safari detection
        if (navigator.vendor.includes('Apple') && (await checkSafariPrivate())) {
            return true;
        }

        // Chrome/Chromium detection
        return await checkChromePrivate();
    } catch (e) {
        console.error('Detection error:', e);
        return false;
    }
}

async function checkStorageAccess(): Promise<boolean> {
    try {
        const testKey = `test_${Date.now()}`;
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

async function checkQuotaLimit(): Promise<boolean> {
    if (!navigator.storage?.estimate) return false;
    
    try {
        const { quota } = await navigator.storage.estimate();
        // Consider quota < 120MB as incognito (primarily for Chrome)
        return quota! < 120 * 1024 * 1024;
    } catch {
        return false;
    }
}

async function checkChromePrivate(): Promise<boolean> {
    // Combine FileSystem API check and quota check
    const fsCheck = await new Promise<boolean>(resolve => {
        const fs = window.webkitRequestFileSystem || (window as any).requestFileSystem;
        if (!fs) return resolve(false);
        
        fs(window.TEMPORARY, 100,
            () => resolve(false),
            () => resolve(true)
        );
    }).catch(() => false);

    return fsCheck || (await checkQuotaLimit());
}

async function checkSafariPrivate(): Promise<boolean> {
    try {
        const key = 'safari_test';
        const bigData = new Array(1024 * 1024).join('a'); // ~1MB
        localStorage.setItem(key, bigData);
        localStorage.removeItem(key);
        return false;
    } catch (e) {
        return true;
    }
}




