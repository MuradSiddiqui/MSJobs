/** Make `server-only` a no-op for Node CLI scripts (tsx). Next.js still enforces it in the app. */
/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function (request, _parent, _isMain) {
  if (request === "server-only") return {};
  return originalLoad.apply(this, arguments);
};
