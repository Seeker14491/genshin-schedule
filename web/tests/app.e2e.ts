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
const resinButtons = (page: Page) => page.getByRole("button", { name: /^[+-]\d+$/ });

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

  // 40 resin at 8 minutes each
  expect(notification).toMatchObject({
    key: "resin",
    time: Now + 40 * 8 * 60000,
    title: "Resin recharged",
    description: "You have 160 resin right now!",
    url: "http://localhost:4174/home",
    icon: "http://localhost:4174/resin.webp",
  });

  // above the threshold, the notification is removed
  const remove = page.waitForRequest((r) => r.method() === "DELETE" && r.url().endsWith("/notifications/resin"));
  await resinInput(page).fill("170");
  await remove;
});

test("only queues the Discord notification for resin recharging to the threshold", async ({ page }) => {
  // between two minutes, so that the notification's time is checked to the second
  await page.clock.setFixedTime(Now + 30000);
  const api = await signIn(page, { resin: { value: 100, time: Now }, resinNotifyMark: 160 });
  await page.goto("/home");

  const put = page.waitForRequest((r) => r.method() === "PUT" && r.url().endsWith("/notifications/resin"));
  await resinInput(page).fill("120");
  await put;

  // reaching the threshold by setting resin doesn't send a notification
  const remove = page.waitForRequest((r) => r.method() === "DELETE" && r.url().endsWith("/notifications/resin"));
  await resinInput(page).fill("160");
  await remove;

  // neither does going above the cap, but dropping below the threshold again does
  await resinInput(page).fill("250");
  await page.waitForTimeout(1500);

  const putAgain = page.waitForRequest((r) => r.method() === "PUT" && r.url().endsWith("/notifications/resin"));
  await page.getByRole("button", { name: "-60", exact: true }).click();
  await page.getByRole("button", { name: "-40", exact: true }).click();
  expect((await putAgain).postDataJSON()).toMatchObject({ time: Now + 30000 + 10 * 8 * 60000 });

  await expect.poll(() => api.find("PUT", "/notifications/resin").length).toBe(2);
});

test("leaves the Discord notification queued when its time comes", async ({ page }) => {
  // 160 resin at 30 seconds past the minute
  const api = await signIn(page, { resin: { value: 159, time: Now - 7.5 * 60000 }, resinNotifyMark: 160 });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("159");

  // removing it now could stop the server from sending it
  await page.clock.setFixedTime(Now + 61000);
  await expect(resinInput(page)).toHaveValue("160");
  await page.waitForTimeout(1500);

  expect(api.requests.filter((r) => r.url().includes("/notifications/"))).toHaveLength(0);
});

test("removes the Discord notification when the threshold is lowered below the resin", async ({ page }) => {
  // 110 resin by now
  await signIn(page, { resin: { value: 100, time: Now - 80 * 60000 }, resinNotifyMark: 160 });
  await page.goto("/settings");

  const remove = page.waitForRequest((r) => r.method() === "DELETE" && r.url().endsWith("/notifications/resin"));
  await page.getByLabel("Send resin notification at").fill("105");
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
  await expect(page.getByRole("button", { name: "Europe server" })).toBeVisible();

  await resinInput(page).fill("90");
  await page.reload();
  await expect(resinInput(page)).toHaveValue("90");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("resin")!))).toEqual({ value: 90, time: Now });
});

test.describe("in Madrid", () => {
  test.use({ timezoneId: "Europe/Madrid" });

  test("shows local time until server time is chosen, with the server's reset either way", async ({ page }) => {
    await useLocally(page, { server: "Europe", resin: { value: 20, time: Now } });
    await page.goto("/home");

    // UTC+2 in summer. Reset is at 4:00 on the server, and resin gains 7.5 an hour
    const reset = page.getByText("Europe server: Thursday, 13h until reset (117 resin)", { exact: true });
    await expect(page.getByText("Local time", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^4:00:00\sPM$/ })).toBeVisible();
    await expect(reset).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByLabel("Time zone")).toHaveValue("local");
    await page.getByLabel("Time zone").selectOption("server");
    await page.goto("/home");

    // the server is on UTC+1 all year
    await expect(page.getByText("Time in Teyvat", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^3:00:00\sPM$/ })).toBeVisible();
    await expect(reset).toBeVisible();
  });
});

test.describe("in British English", () => {
  test.use({ locale: "en-GB" });

  test("shows 24-hour time, which follows the browser's locale rather than the site's language", async ({ page }) => {
    await useLocally(page, { resin: { value: 150, time: Now } });
    await page.goto("/home");

    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.getByRole("heading", { name: "14:00:00" })).toBeVisible();
    await expect(page.getByText("160 in 1h 20m (15:20)", { exact: true })).toBeVisible();
  });
});

test("estimates when resin reaches each multiple of 20", async ({ page }) => {
  await useLocally(page, { resin: { value: 150, time: Now } });
  await page.goto("/home");

  await expect(page.getByText(/^\d+ in /)).toHaveText([
    /^160 in 1h 20m \(3:20\sPM\)$/,
    /^180 in 4h \(6:00\sPM\)$/,
    /^200 in 6h 40m \(8:40\sPM\)$/,
  ]);
});

test("reaches resin values at the second they're due", async ({ page }) => {
  // 160 resin at 30 seconds past the minute
  await useLocally(page, { resin: { value: 159, time: Now - 7.5 * 60000 } });
  await page.goto("/home");

  await expect(resinInput(page)).toHaveValue("159");
  // rounded up to the next minute
  await expect(page.getByText(/^160 in 1m \(2:01\sPM\)$/)).toBeVisible();

  await page.clock.setFixedTime(Now + 31000);
  await expect(resinInput(page)).toHaveValue("160");
  await expect(page.getByText(/^160 in /)).toBeHidden();
});

test("adds and subtracts resin with keyboard shortcuts, whichever buttons there are", async ({ page }) => {
  await useLocally(page, { resin: { value: 100, time: Now }, resinCalcButtons: [-20] });
  await page.goto("/home");
  await expect(resinInput(page)).toHaveValue("100");

  await page.keyboard.press("Digit2");
  await expect(resinInput(page)).toHaveValue("80");

  await page.keyboard.press("Digit6");
  await expect(resinInput(page)).toHaveValue("20");

  // going below 0 is ignored
  await page.keyboard.press("Digit3");
  await page.keyboard.press("Digit2");
  await expect(resinInput(page)).toHaveValue("0");

  // adding goes above the cap
  await page.keyboard.press("Shift+Digit9");
  await page.keyboard.press("Shift+Digit9");
  await page.keyboard.press("Shift+Digit9");
  await expect(resinInput(page)).toHaveValue("270");

  // and is ignored above the maximum
  await resinInput(page).fill("1980");
  await resinInput(page).blur();
  await page.keyboard.press("Shift+Digit3");
  await expect(resinInput(page)).toHaveValue("1980");
  await page.keyboard.press("Shift+Digit2");
  await expect(resinInput(page)).toHaveValue("2000");

  await page.keyboard.press("k");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

test("ignores resin shortcuts while the resin calculator is closed", async ({ page }) => {
  await useLocally(page, { resin: { value: 100, time: Now } });
  await page.goto("/home");

  await page.getByRole("button", { name: "Resin Calculator" }).click();
  await page.keyboard.press("Digit2");
  await page.getByRole("button", { name: "Resin Calculator" }).click();

  await expect(resinInput(page)).toHaveValue("100");
});

test("allows resin above the cap, up to the maximum", async ({ page }) => {
  await useLocally(page, { resin: { value: 100, time: Now } });
  await page.goto("/home");

  await resinInput(page).fill("250");
  await expect(resinInput(page)).toHaveValue("250");
  await expect(page.getByText("Your resin is full.")).toBeVisible();

  // it doesn't recharge above the cap
  await page.clock.setFixedTime(Now + 80 * 60000);
  await page.reload();
  await expect(resinInput(page)).toHaveValue("250");

  await resinInput(page).fill("5000");
  await expect(resinInput(page)).toHaveValue("2000");
  await expect(page.getByRole("button", { name: "+60", exact: true })).toBeHidden();

  await resinInput(page).fill("1940");
  await page.getByRole("button", { name: "+60", exact: true }).click();
  await expect(resinInput(page)).toHaveValue("2000");
});

test("replaces resin buttons saved as the old default", async ({ page }) => {
  const api = await signIn(page, { resin: { value: 100, time: Now }, resinCalcButtons: [-40, -30, -20, -10, 10] });
  await page.goto("/home");
  await expect(resinButtons(page)).toHaveText(["-60", "-40", "-30", "-20", "-10", "+60"]);

  const patch = page.waitForRequest((r) => r.method() === "PATCH");
  await resinInput(page).fill("50");
  const operations: { path: string }[] = (await patch).postDataJSON().patch;

  expect(operations.some((operation) => operation.path.startsWith("/resinCalcButtons"))).toBe(true);
  await expect.poll(() => api.find("PATCH", "/sync").length).toBe(1);
});

test("chooses resin buttons, which are always shown from lowest to highest", async ({ page }) => {
  // saved in another order by an earlier version, which also allowed values that can't be chosen any more
  await useLocally(page, { resin: { value: 150, time: Now }, resinCalcButtons: [10, -20, -100] });
  await page.goto("/home");
  await expect(resinButtons(page)).toHaveText(["-100", "-20", "+10"]);

  await page.goto("/settings");
  const picker = page.getByRole("group", { name: "Resin calculator buttons" });
  const toggle = (name: string) => picker.getByRole("button", { name, exact: true });

  await expect(toggle("-20")).toHaveAttribute("aria-pressed", "true");
  await expect(toggle("-60")).toHaveAttribute("aria-pressed", "false");
  await expect(toggle("-100")).toHaveAttribute("aria-pressed", "true");

  await toggle("-100").click();
  await expect(toggle("-100")).toBeHidden();

  await toggle("+60").click();
  await toggle("-60").click();
  await expect(toggle("-60")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("resinCalcButtons")!))).toEqual([-60, -20, 10, 60]);

  await page.goto("/home");
  await expect(resinButtons(page)).toHaveText(["-60", "-20", "+10", "+60"]);
});

test("follows the system theme until another one is chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await useLocally(page);
  await page.goto("/settings");

  const theme = page.getByLabel("Theme");
  await expect(theme).toHaveValue("system");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);

  await theme.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(theme).toHaveValue("dark");
});

test("sets the notification threshold to any whole number from 1 to 200", async ({ page }) => {
  const api = await signIn(page, { resin: { value: 100, time: Now } });
  await page.goto("/settings");

  const threshold = page.getByLabel("Send resin notification at");
  await expect(threshold).toHaveValue("200");

  const put = page.waitForRequest((r) => r.method() === "PUT" && r.url().endsWith("/notifications/resin"));
  await threshold.fill("155");
  expect((await put).postDataJSON()).toMatchObject({
    time: Now + 55 * 8 * 60000,
    description: "You have 155 resin right now!",
  });

  await threshold.fill("300");
  await expect(threshold).toHaveValue("200");

  await threshold.fill("0");
  await expect(threshold).toHaveValue("1");

  // an empty field shows the saved value again when it loses focus
  await threshold.fill("");
  await threshold.blur();
  await expect(threshold).toHaveValue("1");

  // added or replaced, depending on whether the first change was already saved
  await expect
    .poll(() => api.find("PATCH", "/sync").at(-1)?.postDataJSON().patch)
    .toContainEqual(expect.objectContaining({ path: "/resinNotifyMark", value: 1 }));
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
