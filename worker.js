/**
 * Cloudflare Worker Entrypoint for Static Asset Delivery & SPA Routing
 * Compatible with Wrangler 3.x and 4.x
 */
export default {
  async fetch(request, env) {
    // Serve static assets from ./dist (configured via [assets] in wrangler.toml)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  }
};
