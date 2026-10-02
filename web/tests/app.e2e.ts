import { expect, type Page, test } from "@playwright/test";
import { FakeApi } from "./api";

const Now = Date.parse("2026-10-01T14:00:00Z");

/** Signs in with a fake account whose synced data is `data`. */
async function signIn(page: Page, data: Record<string, unknown> = {}) {
  const api = new FakeApi(page);
  api.data = data;
  await api.install();
  await page.context().addCookies([{ name: "token", value: "auth-token", url: "http://localhost:4174" }]);
  return api;
}

/** Continues without signing in, with `data` already in browser storage as the site stores it. */
async function useLocally(page: Page, data: Record<string, unknown> = {}) {
  const api = new FakeApi(page);
  await api.install();
  await page.context().addCookies([{ name: "token", value: "null", url: "http://localhost:4174" }]);
  await page.addInitScript((data) => {
    if (!sessionStorage.getItem("initialized")) {
      sessionStorage.setItem("initialized", "1");
      Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
    }
  }, data);
  return api;
}

const resinInput = (page: Page) => page.getByRole("spinbutton", { name: "Resin", exact: true });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(Now);
});

test("signs in and shows the home page", async ({ page }) => {
  const api = new FakeApi(page);
  await api.install();

  await page.goto("/");
  await page.getByPlaceholder("Username").fill("traveler");
  await page.getByPlaceholder("Password").fill("secret");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL("/home");
  await expect(resinInput(page)).toBeVisible();
  expect(api.find("GET", "/sync")).toHaveLength(1);
  expect((await page.context().cookies()).find((c) => c.name === "token")?.value).toBe("auth-token");
});

test("shows the server's error when signing in fails", async ({ page }) => {
  const api = new FakeApi(page);
  await api.install();

  await page.goto("/");
  await page.getByPlaceholder("Username").fill("traveler");
  await page.getByPlaceholder("Password").fill("wrong");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("alert")).toContainText("Invalid username or password.");
  await expect(page).toHaveURL("/");
});

test("sends changes to the server", async ({ page }) => {
  const api = await signIn(page, { resin: { value: 100, time: Now } });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("100");

  const patch = page.waitForRequest((r) => r.method() === "PATCH");
  await resinInput(page).fill("50");
  const request = await patch;

  expect(request.postDataJSON()).toMatchObject({ token: "sync-0" });
  expect(request.postDataJSON().patch).toContainEqual({ op: "replace", path: "/resin/value", value: 50 });
  await expect.poll(() => api.find("PATCH", "/sync").length).toBe(1);
});

test("replaces local changes with the server's data when another device changed it", async ({ page }) => {
  const api = await signIn(page, { theme: "light", resin: { value: 100, time: Now } });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("100");

  // another device changes the data
  api.token = "elsewhere";
  api.data = { theme: "dark", resin: { value: 180, time: Now } };

  await resinInput(page).fill("50");

  await expect(resinInput(page)).toHaveValue("180");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("signs out when the server rejects the token", async ({ page }) => {
  const api = await signIn(page);
  api.authStatus = 401;

  await page.goto("/home");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Genshin Schedule" })).toBeVisible();
  expect((await page.context().cookies()).find((c) => c.name === "token")).toBeUndefined();
});

test("shows an error page when the data can't be loaded", async ({ page }) => {
  const api = await signIn(page);
  api.authStatus = 500;

  await page.goto("/home");

  await expect(page.getByText("Could not load your data")).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("queues the Discord notification only when it changes", async ({ page }) => {
  const api = await signIn(page, { resin: { value: 100, time: Now }, resinNotifyMark: 160 });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("100");

  // opening the page doesn't send anything
  await page.waitForTimeout(1500);
  expect(api.requests.filter((r) => r.url().includes("/notifications/"))).toHaveLength(0);

  const put = page.waitForRequest((r) => r.method() === "PUT" && r.url().endsWith("/notifications/resin"));
  await resinInput(page).fill("120");
  const notification = (await put).postDataJSON();

  // 40 resins at 8 minutes each
  expect(notification).toMatchObject({
    key: "resin",
    time: Now + 40 * 8 * 60000,
    title: "Resin recharged",
    description: "You have 160 resins right now!",
    url: "http://localhost:4174/home",
    icon: "http://localhost:4174/resin.webp",
  });

  // above the threshold, the notification is removed
  const remove = page.waitForRequest((r) => r.method() === "DELETE" && r.url().endsWith("/notifications/resin"));
  await resinInput(page).fill("170");
  await remove;
});

test("doesn't queue notifications for users who aren't signed in", async ({ page }) => {
  const api = await useLocally(page, { resin: { value: 100, time: Now }, resinNotifyMark: 160 });
  await page.goto("/home");

  await resinInput(page).fill("120");
  await page.waitForTimeout(1500);

  expect(api.requests).toHaveLength(0);
});

test("loads data stored in the browser by users who aren't signed in", async ({ page }) => {
  await useLocally(page, { server: "Europe", resin: { value: 120, time: Now } });
  await page.goto("/home");

  await expect(resinInput(page)).toHaveValue("120");
  await expect(page.getByRole("button", { name: "Europe" })).toBeVisible();

  await resinInput(page).fill("90");
  await page.reload();
  await expect(resinInput(page)).toHaveValue("90");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("resin")!))).toEqual({ value: 90, time: Now });
});

test("adds and subtracts resin with keyboard shortcuts", async ({ page }) => {
  await useLocally(page, { resin: { value: 100, time: Now } });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("100");

  await page.keyboard.press("Digit2");
  await expect(resinInput(page)).toHaveValue("80");

  await page.keyboard.press("Shift+Digit1");
  await expect(resinInput(page)).toHaveValue("90");

  await page.keyboard.press("k");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

test.describe("in Japanese", () => {
  test.use({ locale: "ja-JP" });

  test("uses the browser's language until another one is chosen", async ({ page }) => {
    await useLocally(page);
    await page.goto("/settings");

    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("heading", { name: "設定" })).toBeVisible();

    await page.getByLabel("言語").selectOption("de");

    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.getByRole("heading", { name: "Einstellungen" })).toBeVisible();
  });
});

test("treats languages that are no longer available as the default", async ({ page }) => {
  await useLocally(page, { language: "nb-NO" });
  await page.goto("/settings");

  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(page.getByLabel("Language")).toHaveValue("default");
});

test("checks data before overwriting it", async ({ page }) => {
  await useLocally(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Manage data" }).click();

  const dialog = page.getByRole("dialog", { name: "Manage data" });
  await dialog.getByRole("textbox").fill("{");
  await dialog.getByRole("button", { name: "Overwrite" }).click();

  await expect(page.getByText("The data is not valid JSON.")).toBeVisible();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox").fill('{ "theme": "dark" }');
  await dialog.getByRole("button", { name: "Overwrite" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("shows a message for pages that don't exist", async ({ page }) => {
  await page.goto("/does-not-exist");

  await expect(page.getByText("Page not found")).toBeVisible();
});
