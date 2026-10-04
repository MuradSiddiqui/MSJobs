import { describe, expect, it } from "vitest";
import { fingerprintOf, isLikelyDuplicate, trigramSimilarity } from "@/lib/core/dedupe/fingerprint";
import { normalizeCompany, normalizeTitle } from "@/lib/core/normalize/text";

describe("normalization and dedupe", () => {
  it("normalizes German company suffixes", () => {
    expect(normalizeCompany("Celonis GmbH")).toBe("celonis");
  });

  it("strips m/w/d from titles", () => {
    expect(normalizeTitle("Software Engineer (m/w/d)")).toContain("software engineer");
    expect(normalizeTitle("Software Engineer (m/w/d)")).not.toContain("m/w/d");
  });

  it("fingerprints the same role from two sources as equal", () => {
    const a = fingerprintOf({ companyName: "n8n GmbH", title: "Frontend Engineer", city: "Berlin" });
    const b = fingerprintOf({ companyName: "n8n", title: "Frontend Engineer (m/w/d)", city: "Berlin" });
    expect(a).toBe(b);
  });

  it("detects near-duplicate titles at the same company", () => {
    expect(
      isLikelyDuplicate(
        {
          id: "1",
          source: "greenhouse",
          sourceJobId: "a",
          canonicalUrl: "https://example.com/a",
          company: "Parloa",
          title: "Senior Software Engineer",
          city: "Berlin",
        },
        {
          id: "2",
          source: "ashby",
          sourceJobId: "b",
          canonicalUrl: "https://example.com/b",
          company: "Parloa GmbH",
          title: "Senior Software Engineer (m/w/d)",
          city: "Berlin",
        },
      ),
    ).toBe(true);
  });

  it("trigram similarity is high for close titles", () => {
    expect(trigramSimilarity("frontend engineer", "front end engineer")).toBeGreaterThan(0.4);
  });
});
