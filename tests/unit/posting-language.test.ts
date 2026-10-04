import { describe, expect, it } from "vitest";
import { detectPostingLanguage } from "@/lib/core/taxonomy/posting-language";

describe("detectPostingLanguage", () => {
  it("detects German ads", () => {
    const lang = detectPostingLanguage(
      "Werkstudent Softwareentwicklung (m/w/d)",
      "Wir suchen Verstärkung für unser Team. Zu Ihren Aufgaben gehören Backend-Entwicklung und Tests. Bewerben Sie sich jetzt.",
    );
    expect(lang).toBe("de");
  });

  it("detects English ads", () => {
    const lang = detectPostingLanguage(
      "Software Engineer – Backend",
      "We are looking for an engineer to join our team. You will work with TypeScript and Postgres. Apply today and tell us about your experience.",
    );
    expect(lang).toBe("en");
  });
});
