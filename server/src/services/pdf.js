import fs from "fs";
import pdf from "pdf-parse";

export async function extractPdfText(path) {
  const data = await pdf(fs.readFileSync(path));
  return data.text;
}
