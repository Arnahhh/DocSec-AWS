// src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { db } from "../firebase";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function hashFile(file) {
    const buffer     = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

const STEPS = [
    { id: "hashing",   label: "Hashing file",           icon: "🔐" },
    { id: "uploading", label: "Uploading to Cloudinary", icon: "☁️" },
    { id: "stamping",  label: "Stamping on Sepolia",     icon: "⛓️" },
    { id: "saving",    label: "Saving record",           icon: "💾" },
];

function initialStepState() {
    return Object.fromEntries(STEPS.map((s) => [s.id, "idle"]));
}

// ── Sidebar nav items — only the ones that actually do something ───────────────
const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "upload",    label: "Upload",    icon: "↑"  },
    { id: "docs",      label: "My Documents", icon: "📄" },
];

export default function Dashboard() {
    const { user, logout, isAuthenticated, getIdToken } = useAuth();
    const navigate = useNavigate();

    const [activeNav, setActiveNav]           = useState("dashboard");
    const [documents, setDocuments]           = useState([]);
    const [docsLoading, setDocsLoading]       = useState(true);
    const [queryError, setQueryError]         = useState("");
    const [uploading, setUploading]           = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [stepState, setStepState]           = useState(initialStepState());
    const [uploadError, setUploadError]       = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) navigate("/login");
    }, [isAuthenticated, navigate]);

    // ── Firestore listener — no orderBy to avoid needing a composite index ─────
    // We sort client-side instead.
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "documents"),
            where("uid", "==", user.uid)
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const docs = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    // sort newest first client-side
                    .sort((a, b) => {
                        const ta = a.createdAt?.toMillis?.() ?? 0;
                        const tb = b.createdAt?.toMillis?.() ?? 0;
                        return tb - ta;
                    });
                setDocuments(docs);
                setDocsLoading(false);
                setQueryError("");
            },
            (err) => {
                console.error("Firestore snapshot error:", err);
                setQueryError(err.message);
                setDocsLoading(false);
            }
        );

        return unsub;
    }, [user]);

    if (!isAuthenticated) return null;

    const setStep = (id, status) =>
        setStepState((prev) => ({ ...prev, [id]: status }));

    // ── Upload handler ─────────────────────────────────────────────────────────
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError("");
        setUploadProgress(0);
        setStepState(initialStepState());
        setActiveNav("dashboard");

        try {
            setStep("hashing", "active");
            const fullHash  = await hashFile(file);
            const shortHash = `0x${fullHash.slice(0, 4)}...${fullHash.slice(-4)}`;
            setStep("hashing", "done");

            setStep("uploading", "active");
            const { url: cloudinaryUrl, publicId } = await uploadToCloudinary(
                file, (pct) => setUploadProgress(pct)
            );
            setStep("uploading", "done");

            setStep("stamping", "active");
            const token    = await getIdToken();
            const response = await fetch(`${API_URL}/api/documents`, {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: file.name, hash: shortHash,
                    fullHash, cloudinaryUrl, publicId, size: file.size,
                }),
            });

            const data = await response.json();
            if (!response.ok && response.status !== 207) {
                throw new Error(data.error ?? "Backend request failed.");
            }
            if (data.warning) console.warn("Partial success:", data.warning);

            setStep("stamping", data.onChain ? "done" : "error");

            setStep("saving", "active");
            await new Promise((r) => setTimeout(r, 400));
            setStep("saving", "done");

        } catch (err) {
            console.error("Upload flow failed:", err);
            setStepState((prev) => {
                const next      = { ...prev };
                const activeKey = Object.keys(next).find((k) => next[k] === "active");
                if (activeKey) next[activeKey] = "error";
                return next;
            });
            setUploadError(err.message ?? "Something went wrong.");
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                setStepState(initialStepState());
                setUploadError("");
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, uploadError ? 4000 : 2200);
        }
    };

    const handleDelete = async (docItem) => {
        if (!window.confirm(`Delete "${docItem.name}"?`)) return;
        try {
            const token = await getIdToken();
            await fetch(`${API_URL}/api/documents/${docItem.id}`, {
                method:  "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    const handleNavClick = (id) => {
        setActiveNav(id);
        if (id === "upload") {
            fileInputRef.current?.click();
            // Snap back to dashboard after triggering file picker
            setTimeout(() => setActiveNav("dashboard"), 300);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const firstName    = (user?.displayName ?? user?.email ?? "User").split(" ")[0];
    const onChainCount = documents.filter((d) => d.onChain).length;
    const thisMonth    = documents.filter((d) => {
        if (!d.createdAt) return false;
        const now = new Date();
        const ts  = d.createdAt.toDate?.() ?? new Date(d.createdAt);
        return ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
    }).length;

    const formatDate = (ts) => {
        if (!ts) return "—";
        const d = ts.toDate?.() ?? new Date(ts);
        return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatSize = (bytes) => {
        if (!bytes) return "—";
        if (bytes < 1024)        return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // ── What to show in the main area ──────────────────────────────────────────
    const showDocs = activeNav === "docs" || activeNav === "dashboard";

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
                * { box-sizing: border-box; }
                body { background: #060914; color: #fff; margin: 0; font-family: 'DM Sans', sans-serif; }
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                @keyframes stepIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }
            `}</style>

            <input
                ref={fileInputRef} type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />

            <div style={{ display: "flex", minHeight: "100vh", background: "#060914" }}>

                {/* ── Sidebar ────────────────────────────────────────────────── */}
                <div style={{
                    width: 240, background: "rgba(6,9,20,0.97)",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                    padding: "2rem 1.25rem", position: "fixed", height: "100vh",
                    zIndex: 10, display: "flex", flexDirection: "column",
                }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2.5rem" }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                        }}>⛓️</div>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "1.4rem" }}>DocChain</span>
                    </div>

                    {/* Nav */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {NAV_ITEMS.map(({ id, label, icon }) => {
                            const active = activeNav === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => handleNavClick(id)}
                                    style={{
                                        padding: "11px 14px", borderRadius: 10,
                                        textAlign: "left", border: "none",
                                        display: "flex", alignItems: "center", gap: 10,
                                        color: active ? "#fff" : "rgba(255,255,255,0.52)",
                                        background: active ? "rgba(99,102,241,0.18)" : "transparent",
                                        fontWeight: active ? 600 : 400,
                                        cursor: "pointer", fontSize: "0.9rem",
                                        transition: "background 0.18s, color 0.18s",
                                    }}
                                >
                                    <span style={{
                                        fontSize: "0.85rem", width: 18, textAlign: "center",
                                        color: active ? "#a5b4fc" : "rgba(255,255,255,0.35)",
                                    }}>{icon}</span>
                                    {label}
                                    {id === "docs" && documents.length > 0 && (
                                        <span style={{
                                            marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700,
                                            background: "rgba(99,102,241,0.25)", color: "#a5b4fc",
                                            padding: "2px 7px", borderRadius: 20,
                                        }}>{documents.length}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User card + logout */}
                    <div style={{ marginTop: "auto" }}>
                        <div style={{
                            padding: "0.85rem", borderRadius: 12, marginBottom: "0.65rem",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            display: "flex", alignItems: "center", gap: 10,
                        }}>
                            {user?.photoURL
                                ? <img src={user.photoURL} alt="avatar"
                                    style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                                : <div style={{
                                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: "0.85rem",
                                }}>{firstName[0]}</div>
                            }
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {user?.displayName ?? "User"}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} style={{
                            width: "100%", padding: "10px", borderRadius: 10,
                            background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)",
                            color: "#ff6b6b", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem",
                        }}>Sign out</button>
                    </div>
                </div>

                {/* ── Main ──────────────────────────────────────────────────── */}
                <div style={{ marginLeft: 240, flex: 1, padding: "2rem 2.5rem" }}>

                    {/* Header */}
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "flex-start", marginBottom: "2.5rem",
                        flexWrap: "wrap", gap: "1rem",
                    }}>
                        <div>
                            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                                {activeNav === "docs" ? "My Documents" : `Welcome back, ${firstName} 👋`}
                            </h1>
                            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "0.4rem", fontSize: "0.9rem" }}>
                                Your documents · Secured on Ethereum Sepolia
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                padding: "11px 22px", borderRadius: 12,
                                background: uploading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#06b6d4)",
                                border: "none", color: "#fff", fontWeight: 700,
                                cursor: uploading ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem",
                            }}
                        >
                            {uploading ? <><Spinner /> Processing…</> : "↑ Upload Document"}
                        </button>
                    </div>

                    {/* Upload progress panel */}
                    {uploading && (
                        <div style={{
                            marginBottom: "2rem", padding: "1.5rem 1.75rem",
                            background: "rgba(99,102,241,0.06)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            borderRadius: 16, animation: "fadeIn 0.3s ease",
                        }}>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem" }}>
                                Upload in progress
                            </div>
                            {STEPS.map((step) => {
                                const s        = stepState[step.id];
                                const isActive = s === "active";
                                const isDone   = s === "done";
                                const isError  = s === "error";
                                return (
                                    <div key={step.id} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        marginBottom: "0.6rem",
                                        opacity: s === "idle" ? 0.25 : 1,
                                        transition: "opacity 0.3s",
                                        animation: isActive ? "stepIn 0.25s ease" : "none",
                                    }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "0.72rem",
                                            background: isDone  ? "rgba(16,185,129,0.15)"
                                                      : isError ? "rgba(255,60,60,0.15)"
                                                      : isActive ? "rgba(99,102,241,0.2)"
                                                      : "rgba(255,255,255,0.04)",
                                            border: `1px solid ${
                                                isDone  ? "rgba(16,185,129,0.5)"
                                              : isError ? "rgba(255,60,60,0.5)"
                                              : isActive ? "rgba(99,102,241,0.5)"
                                              : "rgba(255,255,255,0.08)"}`,
                                        }}>
                                            {isDone   ? <span style={{ color: "#10b981" }}>✓</span>
                                           : isError  ? <span style={{ color: "#ff6b6b" }}>✕</span>
                                           : isActive ? <Spinner size={11} />
                                           : "·"}
                                        </div>
                                        <span style={{
                                            fontSize: "0.86rem",
                                            color: isDone  ? "#10b981"
                                                 : isError ? "#ff6b6b"
                                                 : isActive ? "#fff"
                                                 : "rgba(255,255,255,0.3)",
                                            fontWeight: isActive || isDone ? 600 : 400,
                                        }}>
                                            {step.icon} {step.label}
                                            {step.id === "uploading" && isActive && uploadProgress > 0 && (
                                                <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 400, marginLeft: 8 }}>
                                                    {uploadProgress}%
                                                </span>
                                            )}
                                            {step.id === "stamping" && isActive && (
                                                <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 400, marginLeft: 8, fontSize: "0.8rem" }}>
                                                    — server is sending tx…
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                );
                            })}
                            {stepState.uploading === "active" && (
                                <div style={{ marginTop: "0.75rem", background: "rgba(255,255,255,0.06)", borderRadius: 100, height: 4, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", borderRadius: 100,
                                        background: "linear-gradient(90deg,#6366f1,#06b6d4)",
                                        width: `${uploadProgress}%`, transition: "width 0.25s",
                                    }} />
                                </div>
                            )}
                            {uploadError && (
                                <div style={{
                                    marginTop: "1rem", padding: "10px 14px", borderRadius: 8,
                                    background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.25)",
                                    color: "#ff6b6b", fontSize: "0.84rem",
                                }}>⚠ {uploadError}</div>
                            )}
                        </div>
                    )}

                    {/* Stats — only on dashboard view */}
                    {activeNav === "dashboard" && (
                        <div style={{ display: "flex", gap: "1.25rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
                            {[
                                { label: "Total Documents", value: documents.length, icon: "📄" },
                                { label: "On-chain Proofs", value: onChainCount,     icon: "⛓️" },
                                { label: "This Month",      value: thisMonth,         icon: "📅" },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    flex: 1, minWidth: 160,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: 16, padding: "1.4rem",
                                }}>
                                    <div style={{ fontSize: "1.4rem", marginBottom: "0.4rem" }}>{s.icon}</div>
                                    <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{s.value}</div>
                                    <div style={{ color: "rgba(255,255,255,0.4)", marginTop: "0.4rem", fontSize: "0.85rem" }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Documents list */}
                    {showDocs && (
                        <div>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", marginBottom: "1.25rem" }}>
                                {activeNav === "dashboard" ? "Recent Uploads" : "All Documents"}
                            </h2>

                            {/* Firestore error */}
                            {queryError && (
                                <div style={{
                                    padding: "12px 16px", borderRadius: 10, marginBottom: "1rem",
                                    background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)",
                                    color: "#ff6b6b", fontSize: "0.85rem",
                                }}>
                                    ⚠ Could not load documents: {queryError}
                                </div>
                            )}

                            {docsLoading ? (
                                <div style={{ textAlign: "center", padding: "4rem" }}><Spinner size={28} /></div>
                            ) : documents.length === 0 ? (
                                <div style={{
                                    textAlign: "center", padding: "4rem 2rem",
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px dashed rgba(255,255,255,0.09)", borderRadius: 16,
                                }}>
                                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📂</div>
                                    <p style={{ color: "rgba(255,255,255,0.38)", margin: 0, fontSize: "0.9rem" }}>
                                        No documents yet. Upload your first one!
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                    {documents.map((docItem) => (
                                        <div key={docItem.id} style={{
                                            background: "rgba(255,255,255,0.03)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            borderRadius: 14, padding: "1.1rem 1.4rem",
                                            display: "flex", alignItems: "center", gap: "1rem",
                                            flexWrap: "wrap", animation: "fadeIn 0.3s ease",
                                        }}>
                                            {/* File info */}
                                            <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 10 }}>
                                                <span style={{ fontSize: "1.4rem" }}>
                                                    {/\.pdf$/i.test(docItem.name)            ? "📄"
                                                   : /\.(png|jpg|jpeg)$/i.test(docItem.name) ? "🖼️"
                                                   : /\.(doc|docx)$/i.test(docItem.name)     ? "📝"
                                                   : "📋"}
                                                </span>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{docItem.name}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                                                        {formatSize(docItem.size)} · {formatDate(docItem.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hash */}
                                            <div style={{
                                                fontFamily: "'DM Mono',monospace", fontSize: "0.75rem",
                                                color: "rgba(255,255,255,0.38)", background: "rgba(255,255,255,0.04)",
                                                padding: "3px 9px", borderRadius: 6,
                                            }}>
                                                {docItem.hash}
                                            </div>

                                            {/* On-chain badge */}
                                            <div style={{
                                                padding: "3px 9px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600,
                                                background: docItem.onChain ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                                                border: `1px solid ${docItem.onChain ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.07)"}`,
                                                color: docItem.onChain ? "#10b981" : "rgba(255,255,255,0.3)",
                                            }}>
                                                {docItem.onChain ? "✓ On-chain" : "⏳ Pending"}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                                                {docItem.cloudinaryUrl && (
                                                    <a href={docItem.cloudinaryUrl} target="_blank" rel="noreferrer" style={linkBtn("indigo")}>
                                                        View
                                                    </a>
                                                )}
                                                {docItem.etherscan && (
                                                    <a href={docItem.etherscan} target="_blank" rel="noreferrer" style={linkBtn("cyan")}>
                                                        Etherscan ↗
                                                    </a>
                                                )}
                                                <button onClick={() => handleDelete(docItem)} style={linkBtn("red")}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function Spinner({ size = 16 }) {
    return (
        <span style={{
            width: size, height: size, flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.18)",
            borderTopColor: "#fff", borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.75s linear infinite",
        }} />
    );
}

const COLORS = {
    indigo: { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#a5b4fc" },
    cyan:   { bg: "rgba(6,182,212,0.12)",  border: "rgba(6,182,212,0.3)",  text: "#06b6d4" },
    red:    { bg: "rgba(255,60,60,0.08)",  border: "rgba(255,60,60,0.2)",  text: "#ff6b6b" },
};

function linkBtn(color) {
    const c = COLORS[color];
    return {
        padding: "5px 12px", borderRadius: 7, fontSize: "0.78rem",
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        textDecoration: "none", fontWeight: 600, cursor: "pointer",
    };
}
