import express from "express";
import { pool } from "../db.js";
import { embed } from "../services/embeddings.js";
import { openai } from "../services/openai.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const embedding = await embed(req.body.query);

  const { rows } = await pool.query(`
    SELECT text FROM chunks
    ORDER BY embedding <-> $1
    LIMIT 5
  `, [embedding]);

  const context = rows.map(r => r.text).join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Answer using the context." },
      { role: "user", content: context + "\n\nQuestion: " + req.body.query }
    ]
  });

  res.json({ answer: completion.choices[0].message.content });
});

export default router;
