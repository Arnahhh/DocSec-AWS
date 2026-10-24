// src/firebaseAdmin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!admin.apps.length) {

    // ── Option B: inline env vars (production / cloud) ─────────────────────────
    if (process.env.FIREBASE_PROJECT_ID) {
        console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines from env var strings
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });

    } else {
        throw new Error(
            "Firebase Admin: provide GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID env vars."
        );
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();