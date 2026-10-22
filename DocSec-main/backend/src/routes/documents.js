// src/routes/documents.js
import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { stampOnChain } from "../utils/stampOnChain.js";

const router = Router();

// All document routes require a valid Firebase ID token
router.use(verifyToken);

// ── GET /api/documents ─────────────────────────────────────────────────────────
// Returns all documents belonging to the authenticated user, newest first.
router.get("/", async (req, res) => {
    try {
        const snapshot = await adminDb
            .collection("documents")
            .where("uid", "==", req.user.uid)
            .orderBy("createdAt", "desc")
            .get();

        const documents = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() ?? null,
        }));

        res.json({ documents });
    } catch (err) {
        console.error("GET /documents error:", err);
        res.status(500).json({ error: "Failed to fetch documents." });
    }
});

// ── POST /api/documents ────────────────────────────────────────────────────────
// Full pipeline:
//   1. Save initial Firestore record (onChain: false)
//   2. Stamp hash on Sepolia via server wallet (silent — no MetaMask)
//   3. Update Firestore record with txHash + etherscan link
router.post("/", async (req, res) => {
    const { name, hash, fullHash, cloudinaryUrl, publicId, size } = req.body;

    if (!name || !fullHash) {
        return res.status(400).json({ error: "name and fullHash are required." });
    }

    // ── Step 1: Create the Firestore record immediately ────────────────────────
    let docRef;
    try {
        docRef = await adminDb.collection("documents").add({
            uid:           req.user.uid,
            name,
            hash:          hash ?? `0x${fullHash.slice(0, 4)}...${fullHash.slice(-4)}`,
            fullHash,
            cloudinaryUrl: cloudinaryUrl ?? null,
            publicId:      publicId      ?? null,
            size:          size          ?? null,
            onChain:       false,
            txHash:        null,
            etherscan:     null,
            createdAt:     FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error("Firestore initial save error:", err);
        return res.status(500).json({ error: "Failed to save document record." });
    }

    // ── Step 2: Stamp hash on Sepolia ──────────────────────────────────────────
    let txHash, etherscan;
    try {
        ({ txHash, etherscan } = await stampOnChain(fullHash));
    } catch (err) {
        console.error("Blockchain stamp error:", err);
        // Document saved but not yet on-chain — return 207 so client knows
        return res.status(207).json({
            id:      docRef.id,
            onChain: false,
            warning: "Document saved but blockchain stamp failed: " + err.message,
        });
    }

    // ── Step 3: Update Firestore record with on-chain proof ────────────────────
    try {
        await docRef.update({
            onChain:   true,
            txHash,
            etherscan,
            stampedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error("Firestore update error:", err);
        return res.status(207).json({
            id:      docRef.id,
            onChain: true,
            txHash,
            etherscan,
            warning: "Stamped on-chain but failed to update Firestore record.",
        });
    }

    res.status(201).json({
        id:      docRef.id,
        onChain: true,
        txHash,
        etherscan,
        message: "Document saved and stamped on Sepolia.",
    });
});

// ── DELETE /api/documents/:id ──────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const docRef = adminDb.collection("documents").doc(id);
        const snap   = await docRef.get();

        if (!snap.exists) {
            return res.status(404).json({ error: "Document not found." });
        }
        if (snap.data().uid !== req.user.uid) {
            return res.status(403).json({ error: "Forbidden." });
        }

        await docRef.delete();
        res.json({ message: "Document deleted." });
    } catch (err) {
        console.error("DELETE /documents/:id error:", err);
        res.status(500).json({ error: "Failed to delete document." });
    }
});

export default router;
