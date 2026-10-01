// Next.js compiles with SWC, but runs this Babel config first on app code (not node_modules).
// It's only used to generate react-intl message IDs from `defaultMessage` at compile time.
const { messageIdPattern } = require("./langs/message-id");

module.exports = {
  presets: ["next/babel"],
  plugins: [["formatjs", { idInterpolationPattern: messageIdPattern }]],
};
