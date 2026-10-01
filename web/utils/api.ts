import type { Patch } from "rfc6902";
import type { Config } from "./config";

export type User = {
  username: string;
  createdTime: number;
  isAdmin: boolean;
  discordUserId?: string | number | null;
};

export type WebData = {
  token: string;
  data: Partial<Config>;
};

export type Notification = {
  key: string;
  time: number;
  icon: string;
  title: string;
  description: string;
  url: string;
  color: string;
};

export type AuthRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type SyncRequest = {
  token: string;
  patch: Patch;
};

export type SyncResult = { type: "success"; token: string } | ({ type: "failure" } & WebData);

export const ApiUrlDefault = "https://genshin-schedule-sync.caprover.seekr.pw/api/v1";
export const ApiUrlPublic = process.env.NEXT_PUBLIC_API_PUBLIC || ApiUrlDefault;
export const ApiUrlInternal = process.env.NEXT_PUBLIC_API_INTERNAL || ApiUrlPublic;

/** Name of the cookie holding the auth token. Its value is "null" for users who continue without signing in. */
export const AuthCookie = "token";
export const AnonymousToken = "null";

export function isAuthenticated(token: string | undefined): token is string {
  return token !== undefined && token !== AnonymousToken;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

/** Client for the sync server API. Use `createApiClient` in the browser or `createServerApiClient` on the server. */
export class ApiClient {
  constructor(
    readonly baseUrl: string,
    readonly token?: string,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown, contentType = "application/json"): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method,
      cache: "no-store",
      headers: {
        ...(this.token && { authorization: `Bearer ${this.token}` }),
        ...(body !== undefined && { "content-type": contentType }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let data: unknown = text;

    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      // plain text response
    }

    if (!response.ok) {
      throw new ApiError(
        response.status,
        getErrorMessage(data) || `Request failed with status ${response.status}.`,
        data,
      );
    }

    return data as T;
  }

  auth(request: AuthRequest) {
    return this.request<AuthResponse>("POST", "auth", request);
  }

  authBypass(username: string) {
    return this.request<AuthResponse>("GET", `users/${encodeURIComponent(username)}/auth`);
  }

  updateAuth(request: AuthRequest) {
    return this.request<AuthResponse>("PUT", "auth", request);
  }

  getSelf() {
    return this.request<User>("GET", "auth");
  }

  getSync() {
    return this.request<WebData>("GET", "sync");
  }

  /** Applies a patch to the synchronized data. Fails with the latest data if `request.token` is outdated. */
  async patchSync(request: SyncRequest): Promise<SyncResult> {
    try {
      const response = await this.request<{ token: string }>("PATCH", "sync", request, "application/json-patch+json");
      return { type: "success", token: response.token };
    } catch (e) {
      // the server responds with its latest data if the token is outdated; other errors must not reset local data
      if (e instanceof ApiError && e.status === 400 && isWebData(e.body)) {
        return { type: "failure", ...e.body };
      }

      throw e;
    }
  }

  listNotifications() {
    return this.request<Notification[]>("GET", "notifications");
  }

  async setNotification(notification: Notification) {
    await this.request("PUT", `notifications/${encodeURIComponent(notification.key)}`, notification);
  }

  async deleteNotification(key: string) {
    await this.request("DELETE", `notifications/${encodeURIComponent(key)}`);
  }
}

function isWebData(data: unknown): data is WebData {
  return !!data && typeof data === "object" && "token" in data && "data" in data;
}

// the server responds with either plain text or ASP.NET validation problem details
function getErrorMessage(data: unknown): string | undefined {
  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object" && "title" in data) {
    const { title, errors } = data as { title: string; errors?: Record<string, string[]> };
    const first = errors && Object.values(errors).flat()[0];

    return first || title;
  }
}
