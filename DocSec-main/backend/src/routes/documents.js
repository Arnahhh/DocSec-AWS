// src/routes/documents.js
import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { stampOnChain } from "../utils/stampOnChain.js";

const router = Router();

// All document routes require authentication
router.use(verifyToken);

// GET /api/documents
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

// POST /api/documents
router.post("/", async (req, res) => {
    const { name, hash, fullHash, cloudinaryUrl, publicId, size } = req.body;

    console.log("========== NEW UPLOAD ==========");
    console.log("User:", req.user);
    console.log("Body:", req.body);
    console.log("DB exists:", !!adminDb);

    if (!name || !fullHash) {
        return res.status(400).json({
            error: "name and fullHash are required.",
        });
    }

    let docRef;

    // Step 1 - Save to Firestore
    try {
        docRef = await adminDb.collection("documents").add({
            uid: req.user.uid,
            name,
            hash: hash ?? `0x${fullHash.slice(0, 4)}...${fullHash.slice(-4)}`,
            fullHash,
            cloudinaryUrl: cloudinaryUrl ?? null,
            publicId: publicId ?? null,
            size: size ?? null,
            onChain: false,
            txHash: null,
            etherscan: null,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error("Firestore initial save error:", err);
        return res.status(500).json({
            error: "Failed to save document record.",
        });
    }

    // Step 2 - Stamp on Sepolia
    let txHash;
    let etherscan;

    try {
        const result = await stampOnChain(fullHash);
        txHash = result.txHash;
        etherscan = result.etherscan;
    } catch (err) {
        console.error("\n========== BLOCKCHAIN ERROR ==========");
        console.error(err);
        console.error("Message:", err.message);
        console.error("Code:", err.code);
        console.error("Reason:", err.reason);
        console.error("Short Message:", err.shortMessage);

        if (err.info) {
            console.error("Info:", err.info);
        }

        if (err.error) {
            console.error("Nested Error:", err.error);
        }

        console.error("======================================\n");

        return res.status(207).json({
            id: docRef.id,
            onChain: false,
            warning:
                "Document saved but blockchain stamp failed: " + err.message,
        });
    }

    // Step 3 - Update Firestore
    try {
        await docRef.update({
            onChain: true,
            txHash,
            etherscan,
            stampedAt: FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error("Firestore update error:", err);

        return res.status(207).json({
            id: docRef.id,
            onChain: true,
            txHash,
            etherscan,
            warning:
                "Stamped on-chain but failed to update Firestore record.",
        });
    }

    res.status(201).json({
        id: docRef.id,
        onChain: true,
        txHash,
        etherscan,
        message: "Document saved and stamped on Sepolia.",
    });
});

// DELETE /api/documents/:id
router.delete("/:id", async (req, res) => {
    try {
        const docRef = adminDb.collection("documents").doc(req.params.id);
        const snap = await docRef.get();

        if (!snap.exists) {
            return res.status(404).json({
                error: "Document not found.",
            });
        }

        if (snap.data().uid !== req.user.uid) {
            return res.status(403).json({
                error: "Forbidden.",
            });
        }

        await docRef.delete();

        res.json({
            message: "Document deleted.",
        });
    } catch (err) {
        console.error("DELETE /documents error:", err);
        res.status(500).json({
            error: "Failed to delete document.",
        });
    }
});

export default router;