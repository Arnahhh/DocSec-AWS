// src/middleware/verifyToken.js
import { adminAuth } from "../firebaseAdmin.js";

/**
 * Express middleware that validates a Firebase ID token sent in the
 * Authorization header:  Authorization: Bearer <token>
 *
 * On success  → attaches `req.user` (the decoded token payload) and calls next()
 * On failure  → responds 401
 */
export async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization ?? "";

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed Authorization header." });
    }

    const idToken = authHeader.slice(7);

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        req.user = decoded;   // { uid, email, name, picture, ... }
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}