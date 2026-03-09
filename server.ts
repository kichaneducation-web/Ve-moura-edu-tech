import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT, -- 'student' or 'tutor'
    contact TEXT,
    password TEXT,
    is_member BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tutor_profiles (
    user_id INTEGER PRIMARY KEY,
    education TEXT,
    experience TEXT,
    workplace TEXT,
    location TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    purpose TEXT, -- 'membership', 'unlock_contact'
    target_id INTEGER, -- if purpose is unlock_contact, this is the other user's id
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS unlocked_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- who paid
    target_id INTEGER, -- who was unlocked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { email, name, role, contact, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (email, name, role, contact, password) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(email, name, role, contact, password);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Tutor Profile
  app.post("/api/tutor/profile", (req, res) => {
    const { userId, education, experience, workplace, location } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO tutor_profiles (user_id, education, experience, workplace, location)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, education, experience, workplace, location);
    res.json({ success: true });
  });

  app.get("/api/tutors", (req, res) => {
    const tutors = db.prepare(`
      SELECT u.id, u.name, u.email, tp.education, tp.experience, tp.workplace, tp.location, u.is_member
      FROM users u
      JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'tutor'
    `).all();
    res.json(tutors);
  });

  app.get("/api/students", (req, res) => {
    const students = db.prepare(`
      SELECT id, name, email, contact FROM users WHERE role = 'student'
    `).all();
    res.json(students);
  });

  // Payment & Unlocking
  app.post("/api/payment/request", (req, res) => {
    const { userId, amount, purpose, targetId } = req.body;
    const stmt = db.prepare("INSERT INTO payments (user_id, amount, purpose, target_id) VALUES (?, ?, ?, ?)");
    const result = stmt.run(userId, amount, purpose, targetId);
    res.json({ paymentId: result.lastInsertRowid });
  });

  // Mock payment confirmation (since we don't have real GPay API integration, we'll let user "confirm" for demo)
  app.post("/api/payment/confirm", (req, res) => {
    const { paymentId } = req.body;
    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    db.transaction(() => {
      db.prepare("UPDATE payments SET status = 'completed' WHERE id = ?").run(paymentId);
      
      if (payment.purpose === 'membership') {
        db.prepare("UPDATE users SET is_member = 1 WHERE id = ?").run(payment.user_id);
      } else if (payment.purpose === 'unlock_contact') {
        db.prepare("INSERT OR IGNORE INTO unlocked_contacts (user_id, target_id) VALUES (?, ?)").run(payment.user_id, payment.target_id);
      }
    })();

    res.json({ success: true });
  });

  app.get("/api/unlocked/:userId", (req, res) => {
    const unlocked = db.prepare("SELECT target_id FROM unlocked_contacts WHERE user_id = ?").all(req.params.userId);
    res.json(unlocked.map(u => u.target_id));
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT id, name, email, contact, role, is_member FROM users WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
