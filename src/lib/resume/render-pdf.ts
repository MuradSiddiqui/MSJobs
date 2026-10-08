import PDFDocument from "pdfkit";
import type { ResumeParseResult } from "@/lib/core/schemas/ai";

/** A4 layout matching a classic Google Docs / academic CV (centered header, diamond contacts, L/R date rows). */
const PAGE = { width: 595.28, height: 841.89 };
const MARGIN_X = 54;
const MARGIN_Y = 42;
const CONTENT_WIDTH = PAGE.width - MARGIN_X * 2;
const BLACK = "#000000";
const GRAY = "#333333";
const DIAMOND = " ⋄ ";

export type ResumePdfContact = {
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  website?: string | null;
  github?: string | null;
};

type Ctx = { doc: PDFKit.PDFDocument; y: number };

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y + needed <= PAGE.height - MARGIN_Y) return;
  ctx.doc.addPage();
  ctx.y = MARGIN_Y;
}

function sectionHeading(ctx: Ctx, title: string) {
  ensureSpace(ctx, 26);
  ctx.y += 4;
  ctx.doc.font("Times-Bold").fontSize(11).fillColor(BLACK).text(title.toUpperCase(), MARGIN_X, ctx.y, {
    width: CONTENT_WIDTH,
    align: "left",
  });
  ctx.y = ctx.doc.y + 1;
  ctx.doc
    .moveTo(MARGIN_X, ctx.y)
    .lineTo(MARGIN_X + CONTENT_WIDTH, ctx.y)
    .strokeColor(BLACK)
    .lineWidth(0.8)
    .stroke();
  ctx.y += 7;
}

function leftRight(
  ctx: Ctx,
  left: string,
  right: string,
  opts?: { leftBold?: boolean; size?: number },
) {
  const size = opts?.size ?? 10;
  ensureSpace(ctx, size * 2.2);
  const font = opts?.leftBold ? "Times-Bold" : "Times-Roman";
  const rightWidth = Math.min(160, CONTENT_WIDTH * 0.38);
  const leftWidth = CONTENT_WIDTH - rightWidth - 8;
  const y = ctx.y;
  ctx.doc.font(font).fontSize(size).fillColor(BLACK).text(left, MARGIN_X, y, {
    width: leftWidth,
    align: "left",
  });
  const leftBottom = ctx.doc.y;
  ctx.doc.font("Times-Roman").fontSize(size).fillColor(BLACK).text(right, MARGIN_X + leftWidth + 8, y, {
    width: rightWidth,
    align: "right",
  });
  const rightBottom = ctx.doc.y;
  ctx.y = Math.max(leftBottom, rightBottom) + 1;
}

function bodyText(ctx: Ctx, text: string, size = 9.5) {
  if (!text.trim()) return;
  ensureSpace(ctx, size * 2.5);
  ctx.doc.font("Times-Roman").fontSize(size).fillColor(GRAY).text(text, MARGIN_X, ctx.y, {
    width: CONTENT_WIDTH,
    align: "justify",
    lineGap: 1.2,
  });
  ctx.y = ctx.doc.y + 4;
}

function bullet(ctx: Ctx, text: string) {
  if (!text.trim()) return;
  ensureSpace(ctx, 22);
  const bulletX = MARGIN_X;
  const textX = MARGIN_X + 12;
  const width = CONTENT_WIDTH - 12;
  const y = ctx.y;
  ctx.doc.font("Times-Roman").fontSize(9.5).fillColor(BLACK).text("·", bulletX, y, { width: 10 });
  ctx.doc.font("Times-Roman").fontSize(9.5).fillColor(GRAY).text(text, textX, y, {
    width,
    align: "justify",
    lineGap: 1.1,
  });
  ctx.y = ctx.doc.y + 2;
}

function joinContact(parts: Array<string | null | undefined>): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(DIAMOND);
}

function defaultStrengths(resume: ResumeParseResult): { category: string; items: string }[] {
  if (resume.technicalStrengths?.length) return resume.technicalStrengths;
  const rows: { category: string; items: string }[] = [];
  if (resume.programmingLanguages?.length) {
    rows.push({ category: "Languages", items: resume.programmingLanguages.join(", ") });
  }
  if (resume.frameworks?.length) {
    rows.push({ category: "Frontend / Frameworks", items: resume.frameworks.join(", ") });
  }
  const backend = [...(resume.skills ?? [])].filter(Boolean);
  if (backend.length) rows.push({ category: "Skills", items: backend.join(", ") });
  if (resume.databases?.length) {
    rows.push({ category: "Databases", items: resume.databases.join(", ") });
  }
  const cloudAi = [...(resume.cloudTechnologies ?? []), ...(resume.aiTechnologies ?? [])];
  if (cloudAi.length) rows.push({ category: "Cloud & AI", items: cloudAi.join(", ") });
  return rows;
}

/**
 * Classic 2-page CV layout inspired by academic Google Docs resumes:
 * centered name/contact, uppercase section rules, company+dates rows, mid-dot bullets.
 */
export async function renderResumePdf(
  resume: ResumeParseResult,
  meta?: { jobTitle?: string; company?: string; contact?: ResumePdfContact },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN_Y, bottom: MARGIN_Y, left: MARGIN_X, right: MARGIN_X },
      info: {
        Title: `${resume.name ?? "CV"}`,
        Author: resume.name ?? "MS Jobs",
        Subject: meta?.jobTitle
          ? `Tailored for ${meta.jobTitle}${meta.company ? ` at ${meta.company}` : ""}`
          : "Curriculum Vitae",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ctx: Ctx = { doc, y: MARGIN_Y };
    const contact = {
      email: meta?.contact?.email ?? resume.email ?? null,
      phone: meta?.contact?.phone ?? resume.phone ?? null,
      linkedin: meta?.contact?.linkedin ?? resume.linkedin ?? null,
      website: meta?.contact?.website ?? resume.website ?? null,
      github: meta?.contact?.github ?? resume.github ?? null,
    };

    // —— Header (centered) ——
    doc
      .font("Times-Bold")
      .fontSize(16)
      .fillColor(BLACK)
      .text(resume.name ?? "Curriculum Vitae", MARGIN_X, ctx.y, { width: CONTENT_WIDTH, align: "center" });
    ctx.y = doc.y + 2;

    if (resume.location) {
      doc.font("Times-Roman").fontSize(10).fillColor(BLACK).text(resume.location, MARGIN_X, ctx.y, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      ctx.y = doc.y + 2;
    }

    const line1 = joinContact([contact.phone, contact.email]);
    if (line1) {
      doc.font("Times-Roman").fontSize(9.5).fillColor(BLACK).text(line1, MARGIN_X, ctx.y, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      ctx.y = doc.y + 1;
    }
    const line2 = joinContact([contact.linkedin, contact.website, contact.github]);
    if (line2) {
      doc.font("Times-Roman").fontSize(9).fillColor(BLACK).text(line2, MARGIN_X, ctx.y, {
        width: CONTENT_WIDTH,
        align: "center",
      });
      ctx.y = doc.y + 6;
    } else {
      ctx.y += 4;
    }

    if (resume.summary) {
      sectionHeading(ctx, "Summary");
      bodyText(ctx, resume.summary, 9.5);
    }

    if (resume.workExperience?.length) {
      sectionHeading(ctx, "Experience");
      for (const exp of resume.workExperience) {
        const dates = [exp.startDate, exp.endDate ?? "Present"].filter(Boolean).join(" - ");
        leftRight(ctx, exp.company || "Company", dates, { leftBold: true, size: 10 });
        const roleLine = [exp.role, exp.employmentType].filter(Boolean).join(" - ");
        leftRight(ctx, roleLine || "Role", exp.location ?? "", { size: 9.5 });
        ctx.y += 2;
        for (const line of [...(exp.responsibilities ?? []), ...(exp.achievements ?? [])]) {
          bullet(ctx, line);
        }
        ctx.y += 5;
      }
    }

    if (resume.education?.length) {
      sectionHeading(ctx, "Education");
      for (const edu of resume.education) {
        const left = [edu.institution, edu.location].filter(Boolean).join(", ");
        const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" - ");
        leftRight(ctx, left || "Institution", dates, { leftBold: true, size: 10 });
        const degree = [edu.degree, edu.field].filter(Boolean).join(" in ");
        if (degree) bodyText(ctx, degree, 9.5);
        if (edu.notes) bodyText(ctx, edu.notes, 9);
        ctx.y += 3;
      }
    }

    if (resume.achievements?.length) {
      sectionHeading(ctx, "Achievements & Awards");
      for (const item of resume.achievements) {
        leftRight(ctx, item.title, item.date ?? "", { leftBold: true, size: 10 });
        leftRight(ctx, item.organization ?? "", item.location ?? "", { size: 9.5 });
        ctx.y += 1;
        for (const b of item.bullets ?? []) bullet(ctx, b);
        ctx.y += 4;
      }
    } else if (resume.certifications?.length) {
      sectionHeading(ctx, "Achievements & Awards");
      for (const cert of resume.certifications) bullet(ctx, cert);
    }

    if (resume.projects?.length) {
      sectionHeading(ctx, "Projects");
      for (const project of resume.projects) {
        const dates = [project.startDate, project.endDate].filter(Boolean).join(" - ");
        leftRight(ctx, project.name, dates, { leftBold: true, size: 10 });
        leftRight(ctx, project.role ?? "", project.location ?? "", { size: 9.5 });
        ctx.y += 1;
        const bullets =
          project.bullets?.length > 0
            ? project.bullets
            : project.description
              ? [project.description]
              : [];
        for (const b of bullets) bullet(ctx, b);
        if (project.skills?.length) {
          bodyText(ctx, project.skills.join(", "), 8.5);
        }
        ctx.y += 4;
      }
    }

    const strengths = defaultStrengths(resume);
    if (strengths.length) {
      sectionHeading(ctx, "Technical Strengths");
      for (const row of strengths) {
        ensureSpace(ctx, 18);
        const label = `${row.category}`;
        const labelWidth = 110;
        const y = ctx.y;
        doc.font("Times-Bold").fontSize(9.5).fillColor(BLACK).text(label, MARGIN_X, y, {
          width: labelWidth,
        });
        doc
          .font("Times-Roman")
          .fontSize(9.5)
          .fillColor(GRAY)
          .text(row.items, MARGIN_X + labelWidth, y, { width: CONTENT_WIDTH - labelWidth });
        ctx.y = Math.max(doc.y, y + 12) + 2;
      }
    }

    if (resume.spokenLanguages?.length) {
      sectionHeading(ctx, "Languages");
      for (const lang of resume.spokenLanguages) {
        ensureSpace(ctx, 16);
        const labelWidth = 110;
        const y = ctx.y;
        doc.font("Times-Bold").fontSize(9.5).fillColor(BLACK).text(lang.language, MARGIN_X, y, {
          width: labelWidth,
        });
        doc
          .font("Times-Roman")
          .fontSize(9.5)
          .fillColor(GRAY)
          .text(lang.level ?? "", MARGIN_X + labelWidth, y, { width: CONTENT_WIDTH - labelWidth });
        ctx.y = y + 13;
      }
    }

    doc.end();
  });
}
