// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Configuration for SSG site without R2 dependencies
export default defineCloudflareConfig({
  // Use static assets cache for prerendered routes
  incrementalCache: staticAssetsIncrementalCache,
  // Enable cache interception for better performance
  enableCacheInterception: true,
});
