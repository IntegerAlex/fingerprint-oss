/*!
 * Copyright (c) 2025 Akshat Kotpalliwar (alias IntegerAlex on GitHub)
 * This software is licensed under the GNU Lesser General Public License (LGPL) v3 or later.
 *
 * You are free to use, modify, and redistribute this software, but modifications must also be licensed under the LGPL.
 * This project is distributed without any warranty; see the LGPL for more details.
 *
 * For a full copy of the LGPL and ethical contribution guidelines, please refer to the `COPYRIGHT.md` and `NOTICE.md` files.
 */
/*!
 *
 * detectIncognito v1.5.0
 *
 * https://github.com/Joe12387/detectIncognito
 *
 * MIT License
 *
 * Copyright (c) 2021 - 2025 Joe Rutkowski <Joe@dreggle.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Please keep this comment intact in order to properly abide by the MIT License.
 *
 **/
declare global {
  interface Window {
    detectIncognito: typeof detectIncognito;
  }
}

export async function detectIncognito(): Promise<{ isPrivate: boolean; browserName: string }> {
  return new Promise((resolve, reject) => {
    let browserName = 'Unknown'

    // Return early if not in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      resolve({ isPrivate: false, browserName: 'Unknown' });
      return;
    }

    function __callback(isPrivate: boolean): void {
      resolve({
        isPrivate,
        browserName
      })
    }

    function identifyChromium(): string {
      if (typeof navigator === 'undefined') return 'Unknown';
      
      const ua = navigator.userAgent
      if (ua.match(/Chrome/)) {
        if ((navigator as any).brave !== undefined) {
          return 'Brave'
        } else if (ua.match(/Edg/)) {
          return 'Edge'
        } else if (ua.match(/OPR/)) {
          return 'Opera'
        }
        return 'Chrome'
      } else {
        return 'Chromium'
      }
    }

    function assertEvalToString(value: number): boolean {
      try {
        return value === eval.toString().length
      } catch (e) {
        return false
      }
    }

    function feid(): number {
      let toFixedEngineID = 0
      let neg = parseInt("-1")
      try {
        neg.toFixed(neg)
      } catch (e) {
        toFixedEngineID = (e as Error).message.length
      }
      return toFixedEngineID
    }

    function isSafari(): boolean {
      return feid() === 44
    }

    function isChrome(): boolean {
      return feid() === 51
    }

    function isFirefox(): boolean {
      return feid() === 25
    }

    function isMSIE(): boolean {
      if (typeof navigator === 'undefined') return false;
      return (
        (navigator as any).msSaveBlob !== undefined && assertEvalToString(39)
      )
    }

    /**
     * Safari (Safari for iOS & macOS)
     **/

    async function currentSafariTest() {
      if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) {
        __callback(false);
        return;
      }
      
      try {
        await navigator.storage.getDirectory();
        __callback(false)
      } catch (e) {
        let message = e

        if (e instanceof Error) {
          message = e.message ?? e
        }

        if (typeof message !== 'string') {
          __callback(false); return
        }

        const matchesExpectedError = message.includes('unknown transient reason')

        if (matchesExpectedError) {
          __callback(true)
        } else {
          __callback(false)
        }
      }
    }

    function safari13to18Test(): void {
      if (typeof indexedDB === 'undefined') {
        __callback(false);
        return;
      }
      
      const tmp = String(Math.random());

      try {
        const dbReq = indexedDB.open(tmp, 1);

        dbReq.onupgradeneeded = (ev) => {
          const db = (ev.target as IDBOpenDBRequest).result;

          const finish = (priv: boolean) => { __callback(priv); };

          try {
            db.createObjectStore('t', { autoIncrement: true }).put(new Blob());
            finish(false)
          } catch (err) {
            const msg = (err as Error).message || '';
            if (msg.includes('are not yet supported')) finish(true);
            else finish(false);
          } finally {
            db.close();
            indexedDB.deleteDatabase(tmp);
          }
        };

        dbReq.onerror = () => __callback(false)
      } catch {
        __callback(false)
      }
    }

    function oldSafariTest(): void {
      if (typeof window === 'undefined') {
        __callback(false);
        return;
      }
      
      const openDB = (window as any).openDatabase
      const storage = window.localStorage
      try {
        openDB(null, null, null, null)
      } catch (e) {
        __callback(true); return
      }
      try {
        storage.setItem('test', '1')
        storage.removeItem('test')
      } catch (e) {
        __callback(true); return
      }
      __callback(false)
    }

    async function safariPrivateTest(): Promise<void> {
      if (typeof navigator === 'undefined') {
        __callback(false);
        return;
      }
      
      if (navigator.storage?.getDirectory !== undefined) {
        await currentSafariTest()
      } else if (navigator.maxTouchPoints !== undefined) {
        safari13to18Test()
      } else {
        oldSafariTest()
      }
    }

    /**
     * Chrome
     **/

    function getQuotaLimit(): number {
      if (typeof window === 'undefined' || typeof performance === 'undefined') {
        return 1073741824;
      }
      
      const w = window as any
      if (
        w.performance !== undefined &&
        w.performance.memory !== undefined &&
        w.performance.memory.jsHeapSizeLimit !== undefined
      ) {
        return (performance as any).memory.jsHeapSizeLimit
      }
      return 1073741824
    }

    // >= 76
    function storageQuotaChromePrivateTest(): void {
      if (
        typeof navigator === 'undefined' ||
        !(navigator as any).webkitTemporaryStorage ||
        typeof (navigator as any).webkitTemporaryStorage.queryUsageAndQuota !== 'function'
      ) {
        // Cannot run this check outside browser or required API not available
        __callback(false);
        return;
      }
      
      (navigator as any).webkitTemporaryStorage.queryUsageAndQuota(
        function (_: number, quota: number) {
          const quotaInMib = Math.round(quota / (1024 * 1024))
          const quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2

          __callback(quotaInMib < quotaLimitInMib)
        },
        function (e: any) {
          console.warn('detectIncognito failed to query storage quota:', e.message, '- defaulting to not private');
          __callback(false);
        }
      )
    }

    // 50 to 75
    function oldChromePrivateTest(): void {
      if (typeof window === 'undefined' || !(window as any).webkitRequestFileSystem) {
        __callback(false);
        return;
      }
      
      const fs = (window as any).webkitRequestFileSystem
      const success = function () {
        __callback(false)
      }
      const error = function () {
        __callback(true)
      }
      fs(0, 1, success, error)
    }

    function chromePrivateTest(): void {
      if (typeof self === 'undefined' || typeof Promise === 'undefined') {
        __callback(false);
        return;
      }
      
      if (self.Promise !== undefined && (self.Promise as any).allSettled !== undefined) {
        storageQuotaChromePrivateTest()
      } else {
        oldChromePrivateTest()
      }
    }

    /**
     * Firefox
     **/

    function firefoxPrivateTest(): void {
      if (typeof navigator === 'undefined') {
        __callback(false);
        return;
      }
      
      __callback(navigator.serviceWorker === undefined)
    }

    /**
     * MSIE
     **/

    function msiePrivateTest(): void {
      if (typeof window === 'undefined') {
        __callback(false);
        return;
      }
      
      __callback(window.indexedDB === undefined)
    }

    async function main(): Promise<void> {
      // Early return for non-browser environments
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        __callback(false);
        return;
      }
      
      if (isSafari()) {
        browserName = 'Safari'
        await safariPrivateTest()
      } else if (isChrome()) {
        browserName = identifyChromium()
        chromePrivateTest()
      } else if (isFirefox()) {
        browserName = 'Firefox'
        firefoxPrivateTest()
      } else if (isMSIE()) {
        browserName = 'Internet Explorer'
        msiePrivateTest()
      } else {
        console.warn('detectIncognito cannot determine the browser, defaulting to not private');
        __callback(false);
      }
    }

    main().catch(reject)
  })
}

if (typeof window !== 'undefined') {
  window.detectIncognito = detectIncognito;
}

export default detectIncognito;
