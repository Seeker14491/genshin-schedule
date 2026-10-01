// Extracts all messages from the source code into en_US.pot, then updates every .po file to match:
// translations of messages that still exist are kept, new messages are added untranslated,
// and messages that no longer exist are removed.
import { execFileSync } from "node:child_process";
import { glob, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PO from "pofile";
import { getMessageId, messageIdPattern } from "./message-id.js";

const sources = await Array.fromAsync(
  glob("{app,components,utils,db}/**/*.{ts,tsx}", { exclude: (f) => f.endsWith(".test.ts") }),
);
const dir = await mkdtemp(join(tmpdir(), "genshin-langs-"));

let extracted;

try {
  const outFile = join(dir, "messages.json");

  execFileSync(
    "npx",
    [
      "formatjs",
      "extract",
      ...sources,
      "--id-interpolation-pattern",
      messageIdPattern,
      "--extract-source-location",
      "--throws",
      "--out-file",
      outFile,
    ],
    { stdio: "inherit" },
  );

  extracted = JSON.parse(await readFile(outFile, "utf-8"));
} finally {
  await rm(dir, { recursive: true, force: true });
}

const template = new PO();
template.headers = { "Content-Type": "text/plain; charset=UTF-8" };

for (const [id, { defaultMessage, description, file, line }] of Object.entries(extracted)) {
  if (description) {
    throw new Error(
      `${file}:${line}: message descriptions are not supported, because generate.mjs derives IDs from text only.`,
    );
  }

  if (getMessageId(defaultMessage) !== id) {
    throw new Error(`${file}:${line}: message ID mismatch; check that message-id.js matches messageIdPattern.`);
  }

  const item = new PO.Item();
  item.msgid = defaultMessage;
  item.references = [`${file}:${line}`];
  template.items.push(item);
}

template.items.sort((a, b) => a.references[0].localeCompare(b.references[0], "en", { numeric: true }));
await writeFile("langs/en_US.pot", template.toString() + "\n");

for await (const file of glob("langs/*.po")) {
  const po = PO.parse(await readFile(file, "utf-8"));
  const translations = new Map(po.items.filter((item) => item.msgstr[0]).map((item) => [item.msgid, item]));

  po.items = template.items.map((templateItem) => {
    const item = new PO.Item();
    const existing = translations.get(templateItem.msgid);

    item.msgid = templateItem.msgid;
    item.references = templateItem.references;
    item.msgstr = existing?.msgstr || [""];
    item.flags = existing?.flags || {};

    return item;
  });

  await writeFile(file, po.toString() + "\n");
}
