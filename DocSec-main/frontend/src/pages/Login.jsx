// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { loginWithGoogle, loginWithEmail } = useAuth();

    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    // ── Google login ───────────────────────────────────────────────────────────
    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate("/dashboard");
        } catch (err) {
            setError(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    // ── Email / password login ─────────────────────────────────────────────────
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await loginWithEmail(form.email, form.password);
            navigate("/dashboard");
        } catch (err) {
            setError(friendlyError(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                body { background: #060914; color: #fff; font-family: 'DM Sans', sans-serif; }
                input::placeholder { color: rgba(255,255,255,0.25); }
                input:focus { outline: none; border-color: rgba(99,102,241,0.6) !important; }
            `}</style>

            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center",
                justifyContent: "center", padding: "1.5rem",
                position: "relative", overflow: "hidden", background: "#060914",
            }}>
                {/* Grid background */}
                <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.06) 1px,transparent 1px)",
                    backgroundSize: "50px 50px",
                }} />

                <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: "2.5rem" }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
                        }}>⛓️</div>
                        <span style={{
                            fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: 900,
                            background: "linear-gradient(90deg,#6366f1,#06b6d4)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>DocChain</span>
                    </div>

                    <div style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 20, padding: "2.5rem 2rem", backdropFilter: "blur(16px)",
                    }}>
                        <h2 style={{
                            fontFamily: "'Syne',sans-serif", fontSize: "1.75rem", fontWeight: 800,
                            textAlign: "center", marginBottom: "0.5rem",
                        }}>Welcome back</h2>
                        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
                            Sign in to access your secure documents
                        </p>

                        {/* Error banner */}
                        {error && (
                            <div style={{
                                marginBottom: "1.25rem", padding: "12px 16px", borderRadius: 10,
                                background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)",
                                color: "#ff6b6b", fontSize: "0.88rem",
                            }}>{error}</div>
                        )}

                        {/* Google button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{
                                width: "100%", padding: "14px 20px", borderRadius: 12,
                                background: "#fff", color: "#111", fontWeight: 600,
                                fontSize: "1rem", display: "flex", alignItems: "center",
                                justifyContent: "center", gap: 12, marginBottom: "1.5rem",
                                border: "none", cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
                            }}
                        >
                            <GoogleIcon />
                            {loading ? "Signing in…" : "Continue with Google"}
                        </button>

                        <Divider />

                        {/* Email form */}
                        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                            <Field label="Email" name="email" type="email"
                                placeholder="you@email.com" value={form.email} onChange={handleChange} />
                            <Field label="Password" name="password" type="password"
                                placeholder="••••••••" value={form.password} onChange={handleChange} />

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: "0.5rem", padding: "14px", borderRadius: 12,
                                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                                    border: "none", color: "#fff", fontWeight: 700,
                                    fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? "Signing in…" : "Sign In"}
                            </button>
                        </form>

                        <p style={{ textAlign: "center", marginTop: "1.75rem", color: "rgba(255,255,255,0.5)" }}>
                            Don't have an account?{" "}
                            <Link to="/register" style={{ color: "#06b6d4", textDecoration: "none" }}>Create one →</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Field({ label, name, type, placeholder, value, onChange }) {
    return (
        <div>
            <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>
                {label}
            </label>
            <input
                type={type} name={name} placeholder={placeholder}
                value={value} onChange={onChange} required
                style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: "1rem", transition: "border-color 0.2s",
                }}
            />
        </div>
    );
}

function Divider() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5rem 0", color: "rgba(255,255,255,0.2)" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "0.8rem", fontFamily: "'DM Mono',monospace" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

// Map Firebase error codes to human-friendly messages
function friendlyError(code) {
    const map = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
        "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] ?? "Something went wrong. Please try again.";
}