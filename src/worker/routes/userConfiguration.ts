import { getUserId } from "../auth";
import { mapConfiguration } from "../db";
import { error, json, type Env } from "../index";

export async function handleUserConfiguration(request: Request, env: Env) {
  const userId = getUserId(request, env);

  if (request.method === "GET") {
    const configuration = await getOrCreateConfiguration(env, userId);
    return json({ configuration });
  }

  if (request.method === "PUT") {
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
    const currency = typeof input.currency === "string" && input.currency.trim() ? input.currency.trim().toUpperCase() : "USD";
    const locale = typeof input.locale === "string" && input.locale.trim() ? input.locale.trim() : null;
    const showCurrencySymbol =
      typeof input.show_currency_symbol === "boolean" ? input.show_currency_symbol : true;

    await env.DB.prepare(
      `INSERT INTO user_configuration (user_id, currency, locale, show_currency_symbol)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         currency = excluded.currency,
         locale = excluded.locale,
         show_currency_symbol = excluded.show_currency_symbol,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(userId, currency, locale, showCurrencySymbol ? 1 : 0)
      .run();

    const configuration = await getOrCreateConfiguration(env, userId);
    return json({ configuration });
  }

  return error("Method not allowed", 405);
}

export async function getOrCreateConfiguration(env: Env, userId: string) {
  const existing = await env.DB.prepare("SELECT * FROM user_configuration WHERE user_id = ?").bind(userId).first();
  if (existing) return mapConfiguration(existing as never);

  await env.DB.prepare("INSERT INTO user_configuration (user_id, currency, locale, show_currency_symbol) VALUES (?, ?, ?, ?)")
    .bind(userId, "USD", null, 1)
    .run();

  const created = await env.DB.prepare("SELECT * FROM user_configuration WHERE user_id = ?").bind(userId).first();
  return mapConfiguration(created as never);
}
