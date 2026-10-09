import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";

const MAX_PAGES = 15;

// Vision-capable Groq model used only for scanned or photographed CVs (PNG uploads).
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

async function extractTextFromPng(buffer: Buffer): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq(VISION_MODEL),
      system:
        "Transcribe the resume in the image. Return only the visible text, preserving section order and line breaks. Do not summarise, do not add commentary, and never invent content.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this CV image and return all visible text." },
            {
              type: "image",
              image: `data:image/png;base64,${buffer.toString("base64")}`,
            },
          ],
        },
      ],
    });
    return text.trim();
  } catch {
    throw new Error("Could not read this image. Try a PDF instead.");
  }
}

export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    if (pdf.numPages > MAX_PAGES) {
      throw new Error(`PDF has ${pdf.numPages} pages; maximum is ${MAX_PAGES}`);
    }
    const { text } = await extractText(pdf, { mergePages: true });
    return (text as string).trim();
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value.trim();
  }
  if (mimeType === "image/png") {
    const text = await extractTextFromPng(buffer);
    if (!text) {
      throw new Error("Could not read this image. Try a PDF instead.");
    }
    return text;
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or PNG.");
}
