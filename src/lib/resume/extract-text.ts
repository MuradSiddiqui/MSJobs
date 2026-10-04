import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_PAGES = 15;

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
  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}
