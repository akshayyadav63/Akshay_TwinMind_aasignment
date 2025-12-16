import express from "express";
import multer from "multer";
import { Queue } from "bullmq";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const queue = new Queue("ingest", {
  connection: { url: process.env.REDIS_URL }
});

router.post("/", upload.single("file"), async (req, res) => {
  const type = req.file.mimetype.includes("audio") ? "audio" : "pdf";
  await queue.add("ingest", { type, path: req.file.path });
  res.json({ status: "queued" });
});

export default router;
