// src/index.js  (updated version)
import "dotenv/config";
import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documents.js";

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ── Health check ────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use("/api/documents", documentRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Page not found." }));

// ── Global error handler ────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error." });
});

// ── Export for Vercel (DO NOT call app.listen here) ─────────────────────────────
export default app;

// For local development only
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`\n🚀  DocChain API running on http://localhost:${PORT}`);
        console.log(`    Health: http://localhost:${PORT}/health\n`);
    });
}
