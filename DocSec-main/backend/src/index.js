import "dotenv/config";
import express from "express";
import cors from "cors";
import { adminDb } from "./firebaseAdmin.js";
import documentRoutes from "./routes/documents.js";

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// Test Firestore Connection
// -----------------------------------------------------------------------------
adminDb
    .collection("__test__")
    .add({
        hello: "world",
        time: new Date(),
    })
    .then(() => {
        console.log("✅ Firestore write works");
    })
    .catch((err) => {
        console.error("❌ Firestore test failed:", err);
    });

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json({ limit: "10mb" }));

// -----------------------------------------------------------------------------
// Health Route
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "DocChain Backend Running",
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
    });
});

// -----------------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------------
app.use("/api/documents", documentRoutes);

// -----------------------------------------------------------------------------
// 404 Handler
// -----------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
    });
});

// -----------------------------------------------------------------------------
// Global Error Handler
// -----------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error("Unhandled Error:");
    console.error(err);

    res.status(500).json({
        error: err.message || "Internal Server Error",
    });
});

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log("\n=====================================");
    console.log("🚀 DocChain Backend Started");
    console.log("=====================================");
    console.log(`Server : http://localhost:${PORT}`);
    console.log(`Health : http://localhost:${PORT}/health`);
    console.log("=====================================\n");
});