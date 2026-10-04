import { existsSync } from "node:fs";
import { resolve } from "node:path";

export function loadScriptEnv(): void {
  const root = process.cwd();
  for (const file of [".env.local", ".env"] as const) {
    const path = resolve(root, file);
    if (existsSync(path)) process.loadEnvFile(path);
  }
}
