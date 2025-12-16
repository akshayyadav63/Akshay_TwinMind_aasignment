import express from "express";
import cors from "cors";
import ingest from "./routes/ingest.js";
import query from "./routes/query.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/ingest", ingest);
app.use("/query", query);

app.listen(3001, () => console.log("API running on 3001"));
