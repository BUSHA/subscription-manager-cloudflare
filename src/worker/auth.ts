import type { Env } from "./index";

const ACCESS_EMAIL_HEADER = "Cf-Access-Authenticated-User-Email";

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
};

export async function getCurrentUser(request: Request, env: Env): Promise<CurrentUser> {
  const email =
    request.headers.get(ACCESS_EMAIL_HEADER)?.trim().toLowerCase() ??
    getLocalDevEmail(request, env);

  if (!email) {
    throw new Error("Cloudflare Access authentication is required");
  }

  const existing = await env.DB.prepare("SELECT id, email, display_name FROM users WHERE lower(email) = lower(?)")
    .bind(email)
    .first<CurrentUser>();

  if (existing) return existing;

  const now = new Date().toISOString();
  const user: CurrentUser = {
    id: email,
    email,
    display_name: displayNameFromEmail(email)
  };

  await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .bind(user.id, user.email, user.display_name, now, now)
    .run();

  return (
    (await env.DB.prepare("SELECT id, email, display_name FROM users WHERE lower(email) = lower(?)")
      .bind(email)
      .first<CurrentUser>()) ?? user
  );
}

function getLocalDevEmail(request: Request, env: Env): string | undefined {
  const email = env.DEV_AUTH_EMAIL || env.DEV_USER_EMAIL || "dev@example.com";
  if (!isLocalRequest(request)) return undefined;
  return email.trim().toLowerCase();
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return email;
  return localPart
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isLocalRequest(request: Request) {
  const url = new URL(request.url);
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
}
