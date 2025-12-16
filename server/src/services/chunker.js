export function chunkText(text, size = 500, overlap = 100) {
  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}
