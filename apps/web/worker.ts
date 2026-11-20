/* Cloudflare Worker entry for SwiftUI Canvas (Workers Static Assets).
 *
 * TanStack Start runs in SPA mode: the build emits a prerendered shell
 * (dist/client/_shell.html) plus hashed assets, and dist/client is bound
 * as ASSETS. Asset requests are served by the platform; this entry only
 * handles requests that matched no file — client-side routes — by
 * answering with the shell, the same shape the twiceword / natori-inn
 * Workers use for their static surfaces.
 */

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" || request.method === "HEAD") {
      const shell = new Request(new URL("/_shell.html", url), request);
      const response = await env.ASSETS.fetch(shell);
      return new Response(response.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache",
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
