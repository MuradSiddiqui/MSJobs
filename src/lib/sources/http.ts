import { detectBotProtection } from "@/lib/sources/html";
import { logger } from "@/lib/logger";

export const ALLOWED_HOSTS = new Set([
  "arbeitnow.com",
  "www.arbeitnow.com",
  "boards-api.greenhouse.io",
  "api.ashbyhq.com",
  "api.smartrecruiters.com",
  "api.lever.co",
  "api.eu.lever.co",
  "*.jobs.personio.de",
  "*.jobs.personio.com",
  "*.recruitee.com",
  "*.teamtailor.com",
  "rest.arbeitsagentur.de",
  "join.com",
]);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_MAX_BYTES = 6_000_000;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;
const MAX_RETRIES = 5;

export type FetchResult<T = unknown> = {
  status: number;
  json: T;
  text: string;
  headers: Headers;
};

type FetchOpts = {
  timeoutMs?: number;
  headers?: Record<string, string>;
  maxBytes?: number;
  accept?: string;
};

type HostGate = {
  tail: Promise<void>;
  nextAt: number;
  intervalMs: number;
};

const gates = new Map<string, HostGate>();

function intervalMsForHost(host: string): number {
  const h = host.toLowerCase();
  if (h.includes("personio")) return 2500;
  if (h.includes("arbeitnow")) return 1200;
  if (h.includes("ashbyhq")) return 1500;
  return 800;
}

function gateFor(host: string): HostGate {
  const key = host.toLowerCase();
  let gate = gates.get(key);
  if (!gate) {
    gate = { tail: Promise.resolve(), nextAt: 0, intervalMs: intervalMsForHost(key) };
    gates.set(key, gate);
  }
  return gate;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPrivateIPv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const a = parts[0] ?? 0;
  const b = parts[1] ?? 0;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h === "::1" || h === "0.0.0.0") return true;
  if (h === "metadata.google.internal" || h === "metadata") return true;
  if (h.includes(":")) {
    if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(h);
    if (mapped?.[1]) return isPrivateIPv4(mapped[1]);
    return false;
  }
  return isPrivateIPv4(h);
}

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  if (ALLOWED_HOSTS.has(h)) return true;
  for (const pattern of ALLOWED_HOSTS) {
    if (!pattern.startsWith("*.")) continue;
    const suffix = pattern.slice(1);
    if (h.endsWith(suffix) && h.length > suffix.length) return true;
  }
  return false;
}

export function isAllowedUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname;
  if (isBlockedHost(host)) return false;
  return hostAllowed(host);
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(header);
  if (Number.isNaN(at)) return null;
  return Math.max(0, at - Date.now());
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const declared = res.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    throw new Error(`Response exceeds ${maxBytes} bytes`);
  }
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Response exceeds ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function scheduleHost<T>(host: string, fn: () => Promise<T>): Promise<T> {
  const gate = gateFor(host);
  let release!: () => void;
  const previous = gate.tail;
  gate.tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const wait = gate.nextAt - Date.now();
    if (wait > 0) await sleep(wait);
    gate.nextAt = Date.now() + gate.intervalMs;
    return await fn();
  } finally {
    release();
  }
}

async function fetchOnce(url: string, opts: FetchOpts): Promise<{ status: number; text: string; headers: Headers }> {
  let current = url;
  for (let hops = 0; ; hops += 1) {
    if (!isAllowedUrl(current)) throw new Error(`URL not allowed: ${current}`);
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      headers: {
        Accept: opts.accept ?? "*/*",
        ...opts.headers,
        "User-Agent": BROWSER_UA,
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      await res.body?.cancel();
      if (!loc) throw new Error(`Redirect ${res.status} without Location`);
      if (hops >= MAX_REDIRECTS) throw new Error(`Too many redirects for ${url}`);
      current = new URL(loc, current).toString();
      if (!isAllowedUrl(current)) throw new Error(`Redirect off allowlist: ${current}`);
      continue;
    }
    const text = await readCapped(res, opts.maxBytes ?? DEFAULT_MAX_BYTES);
    if (detectBotProtection(text, res.status)) {
      logger.warn("bot protection detected", { host: new URL(current).hostname, status: res.status });
      throw new Error(`Bot protection detected (${res.status}) at ${current}`);
    }
    return { status: res.status, text, headers: res.headers };
  }
}

async function fetchPolite(
  url: string,
  opts: FetchOpts,
): Promise<{ status: number; text: string; headers: Headers }> {
  const host = new URL(url).hostname;
  return scheduleHost(host, async () => {
    let lastStatus = 0;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const result = await fetchOnce(url, opts);
      lastStatus = result.status;
      if (result.status !== 429 && result.status !== 503) return result;
      if (attempt === MAX_RETRIES) break;
      const retryAfter = parseRetryAfter(result.headers.get("retry-after"));
      const backoff = Math.min(
        120_000,
        retryAfter ?? 500 * 2 ** attempt + Math.floor(Math.random() * 400),
      );
      logger.warn("http retry", { host, status: result.status, attempt, waitMs: backoff });
      await sleep(backoff);
    }
    throw new Error(`HTTP ${lastStatus} after ${MAX_RETRIES} retries: ${url}`);
  });
}

export async function fetchJson<T>(url: string, opts?: FetchOpts): Promise<FetchResult<T>> {
  const result = await fetchPolite(url, {
    ...opts,
    accept: opts?.accept ?? "application/json, text/plain;q=0.9, */*;q=0.8",
  });
  try {
    return { ...result, json: JSON.parse(result.text) as T };
  } catch {
    throw new Error(`Invalid JSON (${result.status}) from ${url}`);
  }
}

export async function fetchText(
  url: string,
  opts: FetchOpts = {},
): Promise<{ status: number; text: string; headers: Headers }> {
  return fetchPolite(url, opts);
}

export const fetchSource = fetchText;
