// Generates the .json files loaded by the website from the .po translation files.
import { glob, readFile, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import PO from "pofile";
import { getMessageId } from "./message-id.js";

for await (const file of glob("langs/*.{po,pot}")) {
  const po = PO.parse(await readFile(file, "utf-8"));
  const messages = {};
  const isTemplate = file.endsWith(".pot");

  for (const item of po.items) {
    // fuzzy translations need review, so skip them
    if (item.flags.fuzzy) continue;
    if (!item.msgstr[0] && !isTemplate) continue;

    messages[getMessageId(item.msgid)] = item.msgstr[0] || item.msgid;
  }

  await writeFile(`langs/${basename(file, extname(file))}.json`, JSON.stringify(messages, null, 2) + "\n");
}
