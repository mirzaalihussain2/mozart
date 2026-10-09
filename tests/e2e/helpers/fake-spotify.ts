// A tiny fake Spotify for e2e tests (accounts + Web API), on 127.0.0.1:$FAKE_SPOTIFY_PORT (default 4545).
// Run by Playwright as a web server. Scenarios are per browser: a test sets
// the cookie `fake_spotify_scenario` (cookies ignore the port, so /authorize
// sees it); the scenario rides along in the code and the access token, so
// parallel tests never interfere. No cookie → "forbidden" (like an account
// that isn't allowlisted), so tests that don't care land on the dummy persona.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

export const FAKE_SPOTIFY_PORT = Number(process.env.FAKE_SPOTIFY_PORT ?? 4545);
export type Scenario = "ok" | "deny" | "forbidden" | "slow" | "bad_state";
const SCENARIOS: Scenario[] = ["ok", "deny", "forbidden", "slow", "bad_state"];

const fixture = (name: string) => readFileSync(path.join(process.cwd(), "docs/fixtures/spotify", `${name}.json`), "utf8");
const scenarioOf = (value: string | null | undefined): Scenario =>
  SCENARIOS.find((s) => value?.endsWith(`-${s}`) || value === s) ?? "forbidden";

function cookie(header: string | undefined, name: string): string | null {
  return header?.split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.split("=")[1] ?? null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${FAKE_SPOTIFY_PORT}`);
  const json = (status: number, body: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  if (url.pathname === "/health") return json(200, { ok: true });

  if (url.pathname === "/authorize") {
    const scenario = scenarioOf(cookie(req.headers.cookie, "fake_spotify_scenario"));
    const back = new URL(url.searchParams.get("redirect_uri")!);
    if (scenario === "deny") back.searchParams.set("error", "access_denied");
    else back.searchParams.set("code", `code-${scenario}`);
    back.searchParams.set("state", scenario === "bad_state" ? "not-the-state" : (url.searchParams.get("state") ?? ""));
    res.writeHead(302, { Location: back.toString() });
    return res.end();
  }

  if (url.pathname === "/api/token" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const code = new URLSearchParams(body).get("code");
    if (!req.headers.authorization?.startsWith("Basic ") || !code) return json(400, { error: "invalid_request" });
    return json(200, { access_token: `token-${scenarioOf(code)}`, token_type: "Bearer", expires_in: 3600 });
  }

  if (url.pathname.startsWith("/v1/me")) {
    const scenario = scenarioOf(req.headers.authorization?.replace(/^Bearer /, ""));
    if (scenario === "slow") await new Promise((r) => setTimeout(r, 6000));
    if (scenario === "forbidden") return json(403, { error: { status: 403, message: "User not registered in the Developer Dashboard" } });
    if (url.pathname === "/v1/me") return json(200, fixture("me"));
    if (url.pathname === "/v1/me/top/tracks") return json(200, fixture("top-tracks"));
    if (url.pathname === "/v1/me/top/artists") return json(200, fixture("top-artists"));
  }

  json(404, { error: "not_found" });
});

server.listen(FAKE_SPOTIFY_PORT, "127.0.0.1", () => console.log(`fake Spotify on :${FAKE_SPOTIFY_PORT}`));
