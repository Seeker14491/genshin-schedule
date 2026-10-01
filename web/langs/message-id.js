// Message IDs are derived from the English text, so the same text always maps to the same translation.
// Shared by the compiler plugin (babel.config.js) and the translation scripts in this folder.
const { createHash } = require("node:crypto");

exports.messageIdPattern = "[sha512:contenthash:hex:10]";

/** Computes the same ID as `messageIdPattern` for a message without a description. */
exports.getMessageId = (defaultMessage) => createHash("sha512").update(defaultMessage).digest("hex").slice(0, 10);
