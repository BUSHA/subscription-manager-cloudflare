import { handleSubscriptions } from "./routes/subscriptions";
import { handleUserConfiguration } from "./routes/userConfiguration";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DEV_USER_EMAIL?: string;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "");
  const segments = path.split("/").filter(Boolean);

  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    if (segments.length === 1 && segments[0] === "health" && request.method === "GET") {
      return json({ ok: true });
    }

    if (segments[0] === "subscriptions") {
      return handleSubscriptions(request, env, segments.slice(1));
    }

    if (segments.length === 1 && segments[0] === "user-configuration") {
      return handleUserConfiguration(request, env);
    }

    return error("Not found", 404);
  } catch (exception) {
    console.error("API request failed", exception);
    return error("Unexpected server error", 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
