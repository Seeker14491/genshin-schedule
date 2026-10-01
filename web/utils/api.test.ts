import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./api";

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })),
  );
}

describe("ApiClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  const client = new ApiClient("https://example.com/api/v1", "token");

  it("sends the auth token and JSON body", async () => {
    respond(200, { token: "new" });
    await client.patchSync({ token: "old", patch: [] });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://example.com/api/v1/sync");
    expect(init).toMatchObject({
      method: "PATCH",
      headers: { authorization: "Bearer token", "content-type": "application/json-patch+json" },
      body: JSON.stringify({ token: "old", patch: [] }),
    });
  });

  it("returns the server's data when a sync patch is rejected", async () => {
    respond(400, { token: "latest", data: { theme: "dark" } });

    expect(await client.patchSync({ token: "old", patch: [] })).toEqual({
      type: "failure",
      token: "latest",
      data: { theme: "dark" },
    });
  });

  it("throws on other bad requests instead of treating them as a sync conflict", async () => {
    respond(400, { title: "One or more validation errors occurred.", errors: { patch: ["Invalid patch."] } });

    await expect(client.patchSync({ token: "old", patch: [] })).rejects.toThrow("Invalid patch.");
  });

  it("uses the response text as the error message", async () => {
    respond(401, "Invalid username or password.");

    const error = await client.auth({ username: "user", password: "wrong" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Invalid username or password." });
  });
});
