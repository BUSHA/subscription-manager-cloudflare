import type { Env } from "./index";

const ACCESS_EMAIL_HEADER = "Cf-Access-Authenticated-User-Email";

export function getUserId(request: Request, env: Env): string {
  const accessEmail = request.headers.get(ACCESS_EMAIL_HEADER);
  if (accessEmail) {
    return accessEmail.trim().toLowerCase();
  }

  const devUser = env.DEV_USER_EMAIL || "dev@example.com";
  return devUser.trim().toLowerCase();
}
