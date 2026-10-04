type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, extra?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...sanitize(extra),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function sanitize(extra?: Record<string, unknown>): Record<string, unknown> {
  if (!extra) return {};
  const blocked = /password|token|secret|authorization|api[_-]?key|resume_text|cv_text/i;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extra)) {
    if (blocked.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

export const logger = {
  debug: (message: string, extra?: Record<string, unknown>) => emit("debug", message, extra),
  info: (message: string, extra?: Record<string, unknown>) => emit("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => emit("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) => emit("error", message, extra),
};
