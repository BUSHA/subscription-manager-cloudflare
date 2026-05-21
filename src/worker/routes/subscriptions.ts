import type { IntervalUnit, SubscriptionInput } from "../../lib/types";
import { getUserId } from "../auth";
import { error, json, type Env } from "../index";
import { mapSubscription, normalizeTags } from "../db";

const validCycles = new Set(["weekly", "monthly", "quarterly", "yearly", "one-time"]);
const validIntervalUnits = new Set(["days", "weeks", "months", "years"]);
const optionalStringFields = [
  "description",
  "billing_date",
  "dueDate",
  "due_date",
  "category",
  "payment_method",
  "account",
  "url",
  "notes",
  "icon",
  "color"
] as const;

type ValidatedSubscription = Required<Pick<SubscriptionInput, "name" | "amount" | "currency" | "billing_cycle">> &
  Pick<
    SubscriptionInput,
    | "description"
    | "billing_date"
    | "dueDate"
    | "due_date"
    | "category"
    | "payment_method"
    | "account"
    | "url"
    | "notes"
    | "icon"
    | "color"
    | "tags"
  > & {
    autopay: boolean;
    interval_value: number;
    interval_unit: IntervalUnit;
    included: boolean;
    is_active: boolean;
  };

export async function handleSubscriptions(request: Request, env: Env, segments: string[]) {
  const userId = getUserId(request, env);
  const id = segments[0] ? Number.parseInt(segments[0], 10) : null;

  if (segments.length > 1 || (segments[0] && (id === null || !Number.isInteger(id) || id <= 0))) {
    return error("Subscription not found", 404);
  }

  if (id === null && request.method === "GET") return listSubscriptions(env, userId);
  if (id === null && request.method === "POST") return createSubscription(request, env, userId);
  if (id !== null && request.method === "GET") return getSubscription(env, userId, id);
  if (id !== null && request.method === "PUT") return updateSubscription(request, env, userId, id);
  if (id !== null && request.method === "DELETE") return deleteSubscription(env, userId, id);

  return error("Method not allowed", 405);
}

async function listSubscriptions(env: Env, userId: string) {
  const result = await env.DB.prepare(
    "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY is_active DESC, billing_date IS NULL, billing_date ASC, name ASC"
  )
    .bind(userId)
    .all();

  return json({ subscriptions: result.results.map((row) => mapSubscription(row as never)) });
}

async function getSubscription(env: Env, userId: string, id: number) {
  const row = await env.DB.prepare("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?").bind(id, userId).first();
  if (!row) return error("Subscription not found", 404);
  return json({ subscription: mapSubscription(row as never) });
}

async function createSubscription(request: Request, env: Env, userId: string) {
  const input = await parseAndValidate(request);
  if ("response" in input) return input.response;

  const sub = input.subscription;
  const result = await env.DB.prepare(
    `INSERT INTO subscriptions (
      user_id, name, description, amount, currency, billing_cycle, billing_date, due_date,
      category, payment_method, account, url, notes, icon, color, tags,
      autopay, interval_value, interval_unit, included, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      userId,
      sub.name,
      sub.description ?? null,
      sub.amount,
      sub.currency,
      sub.billing_cycle,
      sub.billing_date ?? null,
      sub.billing_date ?? null,
      sub.category ?? null,
      sub.payment_method ?? null,
      sub.account ?? null,
      sub.url ?? null,
      sub.notes ?? null,
      sub.icon ?? null,
      sub.color ?? null,
      normalizeTags(sub.tags),
      sub.autopay ? 1 : 0,
      sub.interval_value,
      sub.interval_unit,
      sub.included ? 1 : 0,
      sub.is_active ? 1 : 0
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?")
    .bind(result.meta.last_row_id, userId)
    .first();

  return json({ subscription: mapSubscription(row as never) }, 201);
}

async function updateSubscription(request: Request, env: Env, userId: string, id: number) {
  const input = await parseAndValidate(request);
  if ("response" in input) return input.response;

  const existing = await env.DB.prepare("SELECT id FROM subscriptions WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first();
  if (!existing) return error("Subscription not found", 404);

  const sub = input.subscription;
  await env.DB.prepare(
    `UPDATE subscriptions SET
      name = ?, description = ?, amount = ?, currency = ?, billing_cycle = ?, billing_date = ?, due_date = ?,
      category = ?, payment_method = ?, account = ?, url = ?, notes = ?, icon = ?, color = ?, tags = ?,
      autopay = ?, interval_value = ?, interval_unit = ?, included = ?,
      is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?`
  )
    .bind(
      sub.name,
      sub.description ?? null,
      sub.amount,
      sub.currency,
      sub.billing_cycle,
      sub.billing_date ?? null,
      sub.billing_date ?? null,
      sub.category ?? null,
      sub.payment_method ?? null,
      sub.account ?? null,
      sub.url ?? null,
      sub.notes ?? null,
      sub.icon ?? null,
      sub.color ?? null,
      normalizeTags(sub.tags),
      sub.autopay ? 1 : 0,
      sub.interval_value,
      sub.interval_unit,
      sub.included ? 1 : 0,
      sub.is_active ? 1 : 0,
      id,
      userId
    )
    .run();

  const row = await env.DB.prepare("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?").bind(id, userId).first();
  return json({ subscription: mapSubscription(row as never) });
}

async function deleteSubscription(env: Env, userId: string, id: number) {
  const result = await env.DB.prepare("DELETE FROM subscriptions WHERE id = ? AND user_id = ?").bind(id, userId).run();
  if (result.meta.changes === 0) return error("Subscription not found", 404);
  return json({ ok: true });
}

async function parseAndValidate(request: Request): Promise<{ subscription: ValidatedSubscription } | { response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: error("Request body must be valid JSON", 400) };
  }

  if (!body || typeof body !== "object") {
    return { response: error("Request body must be an object", 400) };
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const amount = typeof input.amount === "number" ? input.amount : Number(input.amount);
  const requestedCurrency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  const currency = requestedCurrency === "DEFAULT" ? "USD" : requestedCurrency;
  const intervalValue = toPositiveInteger(input.interval_value ?? input.intervalValue, 1);
  const intervalUnit = normalizeIntervalUnit(input.interval_unit ?? input.intervalUnit);
  const billingCycle =
    typeof input.billing_cycle === "string" && input.billing_cycle.trim()
      ? input.billing_cycle.trim()
      : intervalUnitToCycle(intervalUnit);
  const billingDate = cleanString(input.billing_date) || cleanString(input.due_date) || cleanString(input.dueDate);
  const account = cleanString(input.account) || cleanString(input.payment_method);

  if (!name) return { response: error("Name is required", 400) };
  if (!Number.isFinite(amount) || amount < 0) return { response: error("Amount must be a valid number greater than or equal to 0", 400) };
  if (!currency) return { response: error("Currency is required", 400) };
  if (!billingCycle || !validCycles.has(billingCycle)) return { response: error("Billing cycle is required", 400) };
  if (!validIntervalUnits.has(intervalUnit)) return { response: error("interval_unit must be days, weeks, months, or years", 400) };

  for (const field of optionalStringFields) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== "string") {
      return { response: error(`${field} must be a string`, 400) };
    }
  }

  if (input.tags !== undefined && input.tags !== null && !Array.isArray(input.tags)) {
    return { response: error("tags must be an array of strings", 400) };
  }

  return {
    subscription: {
      name,
      amount,
      currency,
      billing_cycle: billingCycle,
      description: cleanString(input.description),
      billing_date: billingDate,
      dueDate: billingDate,
      due_date: billingDate,
      category: cleanString(input.category),
      payment_method: account,
      account,
      url: cleanString(input.url),
      notes: cleanString(input.notes),
      icon: cleanString(input.icon),
      color: cleanString(input.color),
      tags: Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === "string") : [],
      autopay: Boolean(input.autopay),
      interval_value: intervalValue,
      interval_unit: intervalUnit,
      included: typeof input.included === "boolean" ? input.included : true,
      is_active: typeof input.is_active === "boolean" ? input.is_active : input.is_active === undefined ? true : Boolean(input.is_active)
    }
  };
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toPositiveInteger(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeIntervalUnit(value: unknown): IntervalUnit {
  return validIntervalUnits.has(value as string) ? (value as IntervalUnit) : "months";
}

function intervalUnitToCycle(unit: IntervalUnit) {
  switch (unit) {
    case "weeks":
      return "weekly";
    case "years":
      return "yearly";
    default:
      return "monthly";
  }
}
