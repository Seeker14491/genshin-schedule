import type { Page, Request } from "@playwright/test";

export const ApiUrl = "http://api.test/api/v1";

/** A fake sync server for one page. Requests are recorded, and the data and responses can be changed by tests. */
export class FakeApi {
  data: Record<string, unknown> = {};
  token = "sync-0";
  requests: Request[] = [];
  user = { username: "traveler", createdTime: 0, isAdmin: false, discordUserId: null };

  /** Status to respond with to authenticated requests, e.g. 401 to reject the token. */
  authStatus = 200;

  constructor(readonly page: Page) {}

  async install() {
    await this.page.route(`${ApiUrl}/**`, async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace("/api/v1", "");
      const body = request.postDataJSON();
      this.requests.push(request);

      const json = (status: number, value?: unknown) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: value === undefined ? "" : JSON.stringify(value),
        });

      if (request.method() === "POST" && path === "/auth") {
        return body.password === "wrong"
          ? route.fulfill({ status: 401, body: "Invalid username or password." })
          : json(200, { token: "auth-token", user: this.user });
      }

      if (this.authStatus !== 200) {
        return route.fulfill({ status: this.authStatus, body: "Unauthorized." });
      }

      switch (`${request.method()} ${path}`) {
        case "GET /sync":
          return json(200, { token: this.token, data: this.data });

        case "PATCH /sync":
          if (body.token !== this.token) {
            return json(400, { token: this.token, data: this.data });
          }

          this.token = `sync-${this.requests.length}`;
          return json(200, { token: this.token });

        case "GET /auth":
          return json(200, this.user);
      }

      if (path.startsWith("/notifications/")) {
        return route.fulfill({ status: 204 });
      }

      return json(404, "Not found.");
    });
  }

  /** Requests with the given method and path, e.g. ("PATCH", "/sync"). */
  find(method: string, path: string) {
    return this.requests.filter((r) => r.method() === method && new URL(r.url()).pathname === `/api/v1${path}`);
  }
}
