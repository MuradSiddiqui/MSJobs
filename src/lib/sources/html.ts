import { convert } from "html-to-text";
import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "ul", "ol", "li", "strong", "em", "h2", "h3", "a"];

const BOT_MARKERS = [
  "vercel security checkpoint",
  "cdn-cgi/challenge-platform",
  "cf-challenge",
  "cf-browser-verification",
  "just a moment",
  "checking your browser before accessing",
  "attention required! | cloudflare",
  "why have i been blocked",
  "enable javascript and cookies to continue",
  "_incapsula_resource",
  "bot management",
  "please wait while we verify",
];

export function sanitizeDescriptionHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export function htmlToPlainText(html: string): string {
  return convert(html, { wordwrap: false }).trim();
}

function unescapeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

export function unescapeEntitiesTwice(value: string): string {
  return unescapeEntities(unescapeEntities(value));
}

export function detectBotProtection(body: string, status: number): boolean {
  const hay = body.slice(0, 12_000).toLowerCase();
  if (BOT_MARKERS.some((marker) => hay.includes(marker))) return true;
  if (hay.includes("cloudflare") && (hay.includes("challenge") || hay.includes("ray id"))) {
    return true;
  }
  if ((status === 403 || status === 429) && hay.includes("captcha")) return true;
  return false;
}
