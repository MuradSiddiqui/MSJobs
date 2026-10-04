import { describe, expect, it } from "vitest";
import { classifyEmployment } from "@/lib/core/taxonomy/employment";

describe("German employment terminology", () => {
  it("maps Werkstudent Softwareentwicklung to WORKING_STUDENT", () => {
    expect(classifyEmployment("Werkstudent Softwareentwicklung", "", null)).toBe("working_student");
  });

  it("maps Studentische Hilfskraft Informatik to HIWI", () => {
    expect(classifyEmployment("Studentische Hilfskraft Informatik", "", null)).toBe("hiwi");
  });

  it("maps Software Engineer (m/w/d) Vollzeit to FULL_TIME", () => {
    expect(classifyEmployment("Software Engineer (m/w/d) Vollzeit", "", null)).toBe("full_time");
  });

  it("maps WHK as HiWi and Wissenschaftlicher Mitarbeiter as full-time", () => {
    expect(classifyEmployment("WHK Informatik", "", null)).toBe("hiwi");
    expect(classifyEmployment("Wissenschaftlicher Mitarbeiter KI", "", null)).toBe("full_time");
    expect(classifyEmployment("Wissenschaftliche Hilfskraft KI", "", null)).toBe("hiwi");
  });

  it("maps Praktikum and Abschlussarbeit distinctly", () => {
    expect(classifyEmployment("Praktikum Frontend", "", null)).toBe("internship");
    expect(classifyEmployment("Masterarbeit Machine Learning", "", null)).toBe("thesis");
  });
});
