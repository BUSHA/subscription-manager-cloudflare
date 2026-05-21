import type { Subscription, SubscriptionInput, UserConfiguration } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}

export const api = {
  health: () => request<{ ok: true }>("/api/health"),
  listSubscriptions: async () => {
    const data = await request<{ subscriptions: Subscription[] }>("/api/subscriptions");
    return data.subscriptions;
  },
  createSubscription: (subscription: SubscriptionInput) =>
    request<{ subscription: Subscription }>("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription)
    }),
  updateSubscription: (id: number, subscription: SubscriptionInput) =>
    request<{ subscription: Subscription }>(`/api/subscriptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(subscription)
    }),
  deleteSubscription: (id: number) =>
    request<{ ok: true }>(`/api/subscriptions/${id}`, {
      method: "DELETE"
    }),
  getUserConfiguration: () => request<{ configuration: UserConfiguration }>("/api/user-configuration"),
  updateUserConfiguration: (configuration: Partial<UserConfiguration>) =>
    request<{ configuration: UserConfiguration }>("/api/user-configuration", {
      method: "PUT",
      body: JSON.stringify(configuration)
    })
};
