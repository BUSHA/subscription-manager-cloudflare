import { handleSubscriptions } from "./routes/subscriptions";
import { handleUserConfiguration } from "./routes/userConfiguration";
import { getCurrentUser } from "./auth";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DEV_USER_EMAIL?: string;
  DEV_AUTH_EMAIL?: string;
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

    if (segments.length === 1 && segments[0] === "me" && request.method === "GET") {
      const user = await getCurrentUser(request, env);
      return json(user);
    }

    if (segments.length === 1 && segments[0] === "me" && request.method === "PATCH") {
      return updateCurrentUser(request, env);
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

async function updateCurrentUser(request: Request, env: Env) {
  const user = await getCurrentUser(request, env);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return error("Request body must be valid JSON", 400);
  }

  if (!body || typeof body !== "object") {
    return error("Request body must be an object", 400);
  }

  const input = body as Record<string, unknown>;
  const displayName = typeof input.display_name === "string" ? input.display_name.trim() : "";

  if (!displayName) return error("Name is required", 400);
  if (displayName.length > 80) return error("Name is too long", 400);

  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?")
    .bind(displayName, now, user.id)
    .run();

  return json({ ...user, display_name: displayName });
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
