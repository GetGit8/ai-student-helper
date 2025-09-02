import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db.js";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// NEW: simple health route so the UI can show “AI mode: openai/mock”
app.get("/api/health", (req, res) => {
  res.json({ ok: true, mode: process.env.OPENAI_API_KEY ? "openai" : "mock" });
});

// --- Students CRUD ---
app.get("/api/students", (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/students", (req, res) => {
  const { name, email, program, notes } = req.body;
  db.run(
    "INSERT INTO students (name, email, program, notes) VALUES (?,?,?,?)",
    [name, email, program, notes],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      db.get("SELECT * FROM students WHERE id = ?", [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.status(201).json(row);
      });
    }
  );
});

app.put("/api/students/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, program, notes } = req.body;
  db.run(
    "UPDATE students SET name=?, email=?, program=?, notes=? WHERE id=?",
    [name, email, program, notes, id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      db.get("SELECT * FROM students WHERE id = ?", [id], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(row);
      });
    }
  );
});

app.delete("/api/students/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM students WHERE id = ?", [id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ ok: true, deleted: this.changes });
  });
});

// --- AI Chat (OpenAI-first) ---
const openaiKey = process.env.OPENAI_API_KEY;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

app.post("/api/chat", async (req, res) => {
  const { question } = req.body;
  try {
    if (!openai) {
      // CHANGED: friendly demo fallback if no key (so the UI never breaks)
      return res.json({
        answer:
          `Demo mode (no OPENAI_API_KEY). For "${question}", ` +
          `please check your handbook or contact student services.`
      });
    }

    // CHANGED: lock to cost-efficient model
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful student support assistant." },
        { role: "user", content: question }
      ]
    });

    const answer = response.choices?.[0]?.message?.content ?? "No answer";
    res.json({ answer });
  } catch (err) {
    console.error("OpenAI error:", err?.message || err);
    // CHANGED: graceful fallback instead of 500, so your frontend always shows something
    res.json({
      answer:
        `Temporary issue reaching OpenAI. Demo reply for "${question}": ` +
        `please check official university pages or student services.`
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
