import { Worker } from "bullmq";
import { pool } from "../db.js";
import { chunkText } from "../services/chunker.js";
import { embed } from "../services/embeddings.js";
import { extractPdfText } from "../services/pdf.js";
import { transcribeAudio } from "../services/whisper.js";
import crypto from "crypto";

new Worker("ingest", async job => {
  let text;

  if (job.data.type === "pdf") {
    text = await extractPdfText(job.data.path);
  }

  if (job.data.type === "audio") {
    text = await transcribeAudio(job.data.path);
  }

  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embedding = await embed(chunk);
    await pool.query(
      "INSERT INTO chunks VALUES ($1,$2,$3)",
      [crypto.randomUUID(), chunk, embedding]
    );
  }
}, {
  connection: { url: process.env.REDIS_URL }
});
