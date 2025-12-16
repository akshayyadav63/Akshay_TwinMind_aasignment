import fs from "fs";
import { openai } from "./openai.js";

export async function transcribeAudio(path) {
  const transcript = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path),
    model: "whisper-1"
  });
  return transcript.text;
}
