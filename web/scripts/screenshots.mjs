// Screenshots the same pages of two builds of the site (e.g. before and after a change) and compares them.
//
// Usage: node scripts/screenshots.mjs --old <url> --new <url> [--api <url>] [--out <dir>] [--only <name>]
//
// Both sites must be built against the fake API (scripts/fake-api.mjs, default http://localhost:5555/api/v1), which
// this script fills with the same data before each signed-in screenshot. For every page it writes
// <name>-old.png, <name>-new.png and <name>-compare.png (old | new | differences in red) to the output directory
// (default: screenshots), and prints how many pixels differ.
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";

const { values: args } = parseArgs({
  options: {
    old: { type: "string" },
    new: { type: "string" },
    api: { type: "string", default: "http://localhost:5555/api/v1" },
    out: { type: "string", default: "screenshots" },
    only: { type: "string" },
  },
});

if (!args.old || !args.new) {
  console.error("Usage: node scripts/screenshots.mjs --old <url> --new <url> [--api <url>] [--out <dir>]");
  process.exit(1);
}

// Thursday at 9:00 on the America server, so that every page shows the same times
const Now = Date.parse("2026-10-01T14:00:00Z");

const data = (overrides = {}) => ({
  server: "America",
  background: "paimon",
  hiddenWidgets: {},
  resin: { value: 100, time: Now - 30 * 60000 },
  resinNotifyMark: 160,
  realmEnergy: 9000,
  realmRank: 7,
  realmCurrency: { value: 500, time: Now - 5 * 3600000 },
  ...overrides,
});

const viewports = {
  desktop: { viewport: { width: 1280, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
};

const clickText = (text) => async (page) => {
  await page.getByText(text, { exact: true }).first().click();
  await page.waitForTimeout(600);
};

const pages = [
  { name: "welcome", path: "/", account: "none" },
  { name: "home", path: "/home", account: "local", data: data() },
  { name: "home-signed-in", path: "/home", account: "signed-in", data: data() },
  {
    name: "home-full",
    path: "/home",
    account: "local",
    data: data({ resin: { value: 200, time: Now }, realmCurrency: { value: 2000, time: Now } }),
  },
  { name: "home-collapsed", path: "/home", account: "local", data: data({ hiddenWidgets: { realm: true } }) },
  { name: "notifications", path: "/home/notifications", account: "signed-in", data: data() },
  { name: "settings", path: "/settings", account: "signed-in", data: data() },
  { name: "settings-signed-out", path: "/settings", account: "local", data: data() },
  { name: "manage-data", path: "/settings", account: "signed-in", data: data(), action: clickText("Manage data") },
  {
    name: "manage-account",
    path: "/settings",
    account: "signed-in",
    data: data(),
    action: clickText("Manage account"),
  },
  {
    name: "shortcuts",
    path: "/home",
    account: "local",
    data: data(),
    action: async (page) => {
      await page.keyboard.press("k");
      await page.waitForTimeout(600);
    },
  },
  {
    name: "home-hover",
    path: "/home",
    account: "local",
    data: data(),
    action: async (page) => {
      await page.getByText("Adeptal energy").hover();
      await page.waitForTimeout(600);
    },
  },
  {
    name: "tooltip",
    path: "/home",
    account: "local",
    data: data(),
    action: async (page) => {
      await page.getByRole("button", { name: "America" }).hover();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: "sign-in-error",
    path: "/",
    account: "none",
    action: async (page) => {
      await page.getByPlaceholder("Username").fill("traveler");
      await page.getByPlaceholder("Password").fill("wrong");
      await page.getByRole("button", { name: "Submit" }).click();
      await page.waitForTimeout(800);
    },
  },
];

async function setFixture(body) {
  const response = await fetch(`${args.api}/__fixture`, { method: "POST", body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`fake API responded ${response.status}`);
}

async function screenshot(browser, base, { path, account, data, action }, theme, device) {
  const context = await browser.newContext({ ...viewports[device], reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.clock.setFixedTime(Now);

  if (account === "signed-in") {
    await setFixture({ data: { ...data, theme } });
    await context.addCookies([{ name: "token", value: "fake-token-screenshots", url: base }]);
  } else {
    if (account === "local") {
      await context.addCookies([{ name: "token", value: "null", url: base }]);
    }

    await page.addInitScript(
      ({ data, theme }) => {
        localStorage.clear();
        localStorage.setItem("color-mode", theme);
        for (const [key, value] of Object.entries({ ...data, theme })) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      },
      { data: data ?? {}, theme },
    );
  }

  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await action?.(page);

  const png = await page.screenshot({ fullPage: true });
  await context.close();
  return png;
}

/** Draws old | new | differences side by side, and counts differing pixels. Runs in the browser. */
async function compare(browser, oldPng, newPng) {
  const page = await browser.newPage();

  const result = await page.evaluate(
    async ([oldData, newData]) => {
      const load = async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        return image;
      };

      const [a, b] = await Promise.all([load(oldData), load(newData)]);
      const width = Math.max(a.width, b.width);
      const height = Math.max(a.height, b.height);
      const gap = 16;

      const pixels = (image) => {
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");
        context.fillStyle = "#808080";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, width, height);
      };

      const pa = pixels(a);
      const pb = pixels(b);
      const diff = new ImageData(width, height);
      let different = 0;

      for (let i = 0; i < pa.data.length; i += 4) {
        const delta =
          Math.abs(pa.data[i] - pb.data[i]) +
          Math.abs(pa.data[i + 1] - pb.data[i + 1]) +
          Math.abs(pa.data[i + 2] - pb.data[i + 2]);

        if (delta > 48) {
          different++;
          diff.data.set([255, 0, 0, 255], i);
        } else {
          // faded copy of the old screenshot for context
          const gray = (pa.data[i] + pa.data[i + 1] + pa.data[i + 2]) / 3;
          diff.data.set([gray, gray, gray, 64], i);
        }
      }

      const canvas = new OffscreenCanvas(width * 3 + gap * 2, height);
      const context = canvas.getContext("2d");
      context.fillStyle = "#ff00ff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(a, 0, 0);
      context.drawImage(b, width + gap, 0);
      context.fillStyle = "#ffffff";
      context.fillRect((width + gap) * 2, 0, width, height);
      const diffCanvas = new OffscreenCanvas(width, height);
      diffCanvas.getContext("2d").putImageData(diff, 0, 0);
      context.drawImage(diffCanvas, (width + gap) * 2, 0);

      const blob = await canvas.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);

      return { png: btoa(binary), different, total: width * height, sizes: [a.width, a.height, b.width, b.height] };
    },
    [oldPng.toString("base64"), newPng.toString("base64")],
  );

  await page.close();
  return { ...result, png: Buffer.from(result.png, "base64") };
}

await mkdir(args.out, { recursive: true });
const browser = await chromium.launch();

for (const entry of pages) {
  for (const theme of ["light", "dark"]) {
    for (const device of ["desktop", "phone"]) {
      const name = `${entry.name}-${theme}-${device}`;
      if (args.only && !name.includes(args.only)) continue;

      const oldPng = await screenshot(browser, args.old, entry, theme, device);
      const newPng = await screenshot(browser, args.new, entry, theme, device);
      const { png, different, total, sizes } = await compare(browser, oldPng, newPng);

      await writeFile(`${args.out}/${name}-old.png`, oldPng);
      await writeFile(`${args.out}/${name}-new.png`, newPng);
      await writeFile(`${args.out}/${name}-compare.png`, png);

      const size =
        sizes[1] === sizes[3] ? `${sizes[0]}x${sizes[1]}` : `old ${sizes[0]}x${sizes[1]}, new ${sizes[2]}x${sizes[3]}`;
      console.log(`${name.padEnd(36)} ${((different / total) * 100).toFixed(2).padStart(6)}% different  (${size})`);
    }
  }
}

await browser.close();
