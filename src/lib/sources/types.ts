import type { JobSourceName, NormalizedJob } from "@/lib/core/types";

export type RawJobStub = {
  source: JobSourceName;
  sourceJobId: string;
  boardToken?: string;
  payload: unknown;
  listedAt?: string | null;
};

export type JobFetchOptions = {
  boardToken?: string;
  since?: Date;
  maxPages?: number;
};

export type SourceContext = {
  boardToken?: string;
  companyName?: string;
};

export interface JobSourceAdapter {
  readonly name: JobSourceName;
  readonly kind: "aggregator" | "ats_board";
  readonly requiresBoardToken: boolean;
  listJobs(ctx: SourceContext, opts: JobFetchOptions): AsyncIterable<RawJobStub>;
  hydrate?(ctx: SourceContext, stub: RawJobStub): Promise<RawJobStub>;
  normalize(stub: RawJobStub): NormalizedJob;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

export function parseTimestamp(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    if (/^\d+$/.test(value.trim())) return parseTimestamp(Number(value.trim()));
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function requireBoardToken(ctx: SourceContext, name: string): string {
  const token = ctx.boardToken?.trim() || null;
  if (!token) throw new Error(`${name} requires a board token`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(token) || token.includes("..")) {
    throw new Error(`${name} board token is invalid`);
  }
  return token;
}

export function attachCompany(payload: Record<string, unknown>, ctx: SourceContext): Record<string, unknown> {
  return ctx.companyName ? { ...payload, __companyName: ctx.companyName } : payload;
}

export function freshEnough(postedAt: Date | null, since?: Date): boolean {
  if (!since || !postedAt) return true;
  return postedAt.getTime() >= since.getTime();
}
