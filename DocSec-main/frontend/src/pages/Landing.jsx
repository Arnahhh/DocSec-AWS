import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "How It Works", "Tech Stack", "FAQ"];

const FEATURES = [
    {
        icon: "🔐",
        title: "Google Authentication",
        desc: "Sign in instantly with your Google account. Firebase Auth handles sessions, tokens, and security — no passwords to remember.",
    },
    {
        icon: "📄",
        title: "Secure Document Upload",
        desc: "Upload any important document. Files are stored in Firebase Storage with access restricted to the owner only.",
    },
    {
        icon: "🔗",
        title: "Blockchain Timestamping",
        desc: "A SHA-256 hash of every document is written to Ethereum's Sepolia testnet as immutable calldata — proof it existed at that moment.",
    },
    {
        icon: "🧾",
        title: "Tamper Detection",
        desc: "Because the hash lives on-chain, any alteration to the file produces a different hash — immediately flagging tampering.",
    },
    {
        icon: "🌐",
        title: "Etherscan Verification",
        desc: "Every transaction links directly to Sepolia Etherscan. Share the link with anyone to verify your document's existence.",
    },
    {
        icon: "📋",
        title: "Personal Document Log",
        desc: "View all your past uploads in one dashboard — file name, upload date, on-chain status, and the blockchain proof link.",
    },
];

const STEPS = [
    {
        num: "01",
        title: "Sign in with Google",
        desc: "One click. Firebase verifies your identity and issues a secure token to authenticate all subsequent API calls.",
        tag: "Firebase Auth",
        color: "#f97316",
    },
    {
        num: "02",
        title: "Upload your document",
        desc: "Select any file. Your browser hashes it with SHA-256 before it even leaves your device, then the file goes to Firebase Storage.",
        tag: "Firebase Storage",
        color: "#3b82f6",
    },
    {
        num: "03",
        title: "Confirm MetaMask transaction",
        desc: "Your wallet sends a tiny Sepolia ETH transaction with the file hash encoded as calldata — creating a permanent on-chain record.",
        tag: "Ethereum Sepolia",
        color: "#8b5cf6",
    },
    {
        num: "04",
        title: "Get your proof link",
        desc: "The transaction hash is saved to Firestore and linked to your account. Share the Etherscan link as tamper-proof evidence.",
        tag: "Sepolia Etherscan",
        color: "#10b981",
    },
];

const STACK = [
    { name: "Vite + React", role: "Frontend", detail: "Fast dev server, component UI", emoji: "⚡" },
    { name: "Node + Express", role: "Backend API", detail: "Auth middleware, Firestore writes", emoji: "🟢" },
    { name: "Firebase Auth", role: "Identity", detail: "Google OAuth 2.0 login", emoji: "🔑" },
    { name: "Firestore", role: "Database", detail: "Document records & tx status", emoji: "🗄️" },
    { name: "Firebase Storage", role: "File Store", detail: "Encrypted file hosting", emoji: "☁️" },
    { name: "ethers.js", role: "Web3", detail: "MetaMask + Sepolia tx sending", emoji: "🦊" },
    { name: "Ethereum Sepolia", role: "Blockchain", detail: "Immutable hash storage", emoji: "⛓️" },
];

const FAQS = [
    {
        q: "Do I need real ETH?",
        a: "No. This project runs on Ethereum's Sepolia testnet. You get free test ETH from faucets.chain.link — no real money involved.",
    },
    {
        q: "Is my actual document stored on the blockchain?",
        a: "Never. Only a SHA-256 hash (a 64-character fingerprint) of your file is written on-chain. Your document stays in Firebase Storage, accessible only to you.",
    },
    {
        q: "What is calldata?",
        a: "Calldata is optional data attached to an Ethereum transaction. We encode your file hash there, making it permanently part of the blockchain without deploying a smart contract.",
    },
    {
        q: "What happens if I modify the file?",
        a: "Even a single character change produces a completely different SHA-256 hash. The on-chain hash won't match the new file — proving it was altered after the upload.",
    },
    {
        q: "Do I need MetaMask installed?",
        a: "Yes. MetaMask is the browser wallet that connects to Ethereum. Install it as a Chrome/Firefox extension, add some Sepolia test ETH, and you're ready.",
    },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const navBg = scrolled || menuOpen ? "rgba(6,9,20,0.96)" : "transparent";
    const navBd = scrolled || menuOpen ? "blur(16px)" : "none";
    const navBorder = scrolled || menuOpen ? "1px solid rgba(255,255,255,0.06)" : "none";

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            padding: "0 1.5rem", height: 64,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: navBg, backdropFilter: navBd, borderBottom: navBorder,
            transition: "background 0.35s, border-color 0.35s",
        }}>

            {/* ── Logo ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}>⛓️</div>
                <span style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 800,
                    fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em",
                }}>DocChain</span>
            </div>

            {/* ── Desktop nav links ── */}
            <div className="dc-desktop-nav" style={{ display: "flex", gap: "1.75rem", alignItems: "center" }}>
                {NAV_LINKS.map((l) => (
                    <a key={l} href={`#${l.replace(/\s/g, "-").toLowerCase()}`} style={{
                        color: "rgba(255,255,255,0.55)", textDecoration: "none",
                        fontFamily: "'DM Mono',monospace", fontSize: "0.75rem",
                        letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.2s",
                    }}
                        onMouseEnter={(e) => (e.target.style.color = "#fff")}
                        onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.55)")}
                    >{l}</a>
                ))}
            </div>

            {/* ── Desktop auth buttons ── */}
            <div className="dc-desktop-nav" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <button onClick={() => navigate("/login")} style={{
                    padding: "8px 18px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
                    color: "rgba(255,255,255,0.8)", fontFamily: "'DM Mono',monospace",
                    fontSize: "0.76rem", letterSpacing: "0.05em", cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                }}
                    onMouseEnter={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.18)"; e.target.style.color = "rgba(255,255,255,0.8)"; }}
                >Log in</button>
                <button onClick={() => navigate("/register")} style={{
                    padding: "8px 18px", borderRadius: 8,
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    border: "none", color: "#fff", fontFamily: "'DM Mono',monospace",
                    fontSize: "0.76rem", letterSpacing: "0.05em", fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 0 20px rgba(99,102,241,0.35)",
                    transition: "opacity 0.2s, transform 0.2s",
                }}
                    onMouseEnter={(e) => { e.target.style.opacity = "0.88"; e.target.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }}
                >Register →</button>
            </div>

            {/* ── Hamburger (mobile only) ── */}
            <button className="dc-hamburger" onClick={() => setMenuOpen((p) => !p)}
                aria-label="Toggle menu" style={{
                    display: "none", flexDirection: "column", gap: 5,
                    alignItems: "center", justifyContent: "center",
                    background: "none", border: "none", cursor: "pointer", padding: 6,
                }}>
                {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                        display: "block", width: 22, height: 2, borderRadius: 2, background: "#fff",
                        transition: "transform 0.25s, opacity 0.25s",
                        transform: menuOpen
                            ? i === 0 ? "rotate(45deg) translate(5px,5px)"
                                : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "none"
                            : "none",
                        opacity: menuOpen && i === 1 ? 0 : 1,
                    }} />
                ))}
            </button>

            {/* ── Mobile dropdown ── */}
            {menuOpen && (
                <div className="dc-mobile-menu" style={{
                    position: "absolute", top: 64, left: 0, right: 0,
                    background: "rgba(6,9,20,0.98)", backdropFilter: "blur(16px)",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    padding: "1.25rem 1.5rem 1.75rem",
                    display: "flex", flexDirection: "column", gap: "1rem",
                }}>
                    {NAV_LINKS.map((l) => (
                        <a key={l} href={`#${l.replace(/\s/g, "-").toLowerCase()}`}
                            onClick={() => setMenuOpen(false)} style={{
                                color: "rgba(255,255,255,0.65)", textDecoration: "none",
                                fontFamily: "'DM Mono',monospace", fontSize: "0.82rem",
                                letterSpacing: "0.08em", textTransform: "uppercase",
                                paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}>{l}</a>
                    ))}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                        <button onClick={() => { navigate("/login"); setMenuOpen(false); }} style={{
                            flex: 1, padding: "10px", borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
                            color: "#fff", fontFamily: "'DM Mono',monospace",
                            fontSize: "0.8rem", cursor: "pointer",
                        }}>Log in</button>
                        <button onClick={() => { navigate("/register"); setMenuOpen(false); }} style={{
                            flex: 1, padding: "10px", borderRadius: 8,
                            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                            border: "none", color: "#fff", fontFamily: "'DM Mono',monospace",
                            fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                        }}>Register →</button>
                    </div>
                </div>
            )}
        </nav>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
    const navigate = useNavigate();
    return (
        <section style={{
            minHeight: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center", padding: "6rem 1.25rem 3rem",
            position: "relative", overflow: "hidden",
        }}>
            {/* Grid bg */}
            <div style={{
                position: "absolute", inset: 0,
                backgroundImage:
                    "linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px)," +
                    "linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)",
                backgroundSize: "60px 60px", zIndex: 0,
            }} />
            {/* Glow blobs */}
            <div style={{
                position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
                width: "min(600px,90vw)", height: "min(600px,90vw)",
                background: "radial-gradient(ellipse at center,rgba(99,102,241,0.18) 0%,transparent 70%)",
                zIndex: 0, pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute", bottom: "10%", right: "8%",
                width: "min(280px,40vw)", height: "min(280px,40vw)",
                background: "radial-gradient(ellipse at center,rgba(6,182,212,0.13) 0%,transparent 70%)",
                zIndex: 0, pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 680, width: "100%" }}>
                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "5px 14px", borderRadius: 100,
                    border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)",
                    marginBottom: "1.6rem", fontSize: "0.68rem",
                    fontFamily: "'DM Mono',monospace", color: "#a5b4fc",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%", background: "#6366f1",
                        boxShadow: "0 0 8px #6366f1", display: "inline-block",
                        animation: "pulse 2s infinite",
                    }} />
                    Sepolia Testnet · Firebase · React
                </div>

                {/* Heading — scaled down from original */}
                <h1 style={{
                    fontFamily: "'Syne',sans-serif", fontWeight: 900,
                    fontSize: "clamp(1.9rem, 4.5vw, 3.5rem)",
                    lineHeight: 1.06, letterSpacing: "-0.04em",
                    color: "#fff", margin: "0 0 1.15rem",
                }}>
                    Your documents,
                    <br />
                    <span style={{
                        background: "linear-gradient(90deg,#6366f1,#06b6d4,#6366f1)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        animation: "shimmer 3s linear infinite",
                    }}>proven on-chain.</span>
                </h1>

                <p style={{
                    fontSize: "clamp(0.88rem,2vw,0.98rem)", lineHeight: 1.82,
                    color: "rgba(255,255,255,0.5)", maxWidth: 490,
                    margin: "0 auto 2rem", fontFamily: "'DM Sans',sans-serif",
                }}>
                    Upload important files, hash them in your browser, and anchor that proof permanently on the Ethereum blockchain — no smart contracts needed.
                </p>

                {/* CTA row */}
                <div style={{
                    display: "flex", gap: "0.7rem",
                    justifyContent: "center", flexWrap: "wrap",
                }}>
                    <button onClick={() => navigate("/register")} style={{
                        padding: "11px 26px", borderRadius: 10,
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        border: "none", color: "#fff",
                        fontFamily: "'DM Mono',monospace", fontWeight: 700,
                        fontSize: "0.82rem", letterSpacing: "0.04em", cursor: "pointer",
                        boxShadow: "0 0 28px rgba(99,102,241,0.4)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 0 38px rgba(99,102,241,0.6)"; }}
                        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 0 28px rgba(99,102,241,0.4)"; }}
                    >Get Started Free →</button>

                    <button onClick={() => navigate("/login")} style={{
                        padding: "11px 26px", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)",
                        fontFamily: "'DM Mono',monospace", fontSize: "0.82rem",
                        letterSpacing: "0.04em", cursor: "pointer",
                        transition: "border-color 0.2s, color 0.2s",
                    }}
                        onMouseEnter={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.18)"; e.target.style.color = "rgba(255,255,255,0.75)"; }}
                    >Log In</button>

                    <a href="#how-it-works" style={{
                        padding: "11px 26px", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.09)",
                        background: "transparent", color: "rgba(255,255,255,0.4)",
                        fontFamily: "'DM Mono',monospace", fontSize: "0.82rem",
                        letterSpacing: "0.04em", textDecoration: "none",
                        transition: "color 0.2s",
                    }}
                        onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,0.72)")}
                        onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.4)")}
                    >How It Works ↓</a>
                </div>

                {/* Stats */}
                <div style={{
                    display: "flex", gap: "2rem", justifyContent: "center",
                    marginTop: "3.25rem", flexWrap: "wrap",
                }}>
                    {[
                        { val: "SHA-256", label: "Hash Algorithm" },
                        { val: "0 ETH", label: "Real Money Needed" },
                        { val: "∞", label: "On-chain Lifespan" },
                    ].map(({ val, label }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                            <div style={{
                                fontFamily: "'Syne',sans-serif", fontWeight: 800,
                                fontSize: "1.3rem", color: "#fff", letterSpacing: "-0.03em",
                            }}>{val}</div>
                            <div style={{
                                fontFamily: "'DM Mono',monospace", fontSize: "0.62rem",
                                color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
                                textTransform: "uppercase", marginTop: 4,
                            }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
    return (
        <section id="features" style={{ padding: "5rem 1.25rem", maxWidth: 1100, margin: "0 auto" }}>
            <SectionLabel text="Features" />
            <h2 style={sectionTitle}>Everything you need for document proof</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: "1.1rem", marginTop: "2.5rem",
            }}>
                {FEATURES.map(({ icon, title, desc }) => (
                    <div key={title} style={{
                        padding: "1.6rem", borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.07)",
                        background: "rgba(255,255,255,0.03)",
                        transition: "border-color 0.25s, transform 0.25s", cursor: "default",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                        <div style={{
                            width: 42, height: 42, borderRadius: 10,
                            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "1.3rem", marginBottom: "0.9rem",
                        }}>{icon}</div>
                        <h3 style={{
                            fontFamily: "'Syne',sans-serif", fontWeight: 700,
                            fontSize: "0.95rem", color: "#fff",
                            margin: "0 0 0.45rem", letterSpacing: "-0.01em",
                        }}>{title}</h3>
                        <p style={{
                            fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem",
                            color: "rgba(255,255,255,0.44)", lineHeight: 1.7, margin: 0,
                        }}>{desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
    return (
        <section id="how-it-works" style={{
            padding: "5rem 1.25rem",
            background: "rgba(255,255,255,0.015)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
                <SectionLabel text="How It Works" />
                <h2 style={sectionTitle}>Four steps from sign-in to proof</h2>
                <div style={{ marginTop: "2.5rem", position: "relative" }}>
                    {/* Vertical connecting line */}
                    <div style={{
                        position: "absolute", left: 26, top: 44, bottom: 44, width: 1,
                        background: "linear-gradient(to bottom,rgba(99,102,241,0.5),rgba(6,182,212,0.5))",
                    }} />
                    {STEPS.map(({ num, title, desc, tag, color }) => (
                        <div key={num} style={{
                            display: "flex", gap: "1.5rem",
                            alignItems: "flex-start", padding: "1.75rem 0", position: "relative",
                        }}>
                            <div style={{
                                flexShrink: 0, width: 52, height: 52, borderRadius: "50%",
                                background: "rgba(6,9,20,0.85)", border: `1.5px solid ${color}66`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: "'DM Mono',monospace", fontWeight: 700,
                                fontSize: "0.8rem", color, letterSpacing: "0.05em", zIndex: 1,
                            }}>{num}</div>
                            <div style={{ flex: 1, paddingTop: 8, minWidth: 0 }}>
                                <div style={{
                                    display: "inline-block", padding: "3px 10px", borderRadius: 6,
                                    background: `${color}18`, border: `1px solid ${color}33`, color,
                                    fontFamily: "'DM Mono',monospace", fontSize: "0.63rem",
                                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem",
                                }}>{tag}</div>
                                <h3 style={{
                                    fontFamily: "'Syne',sans-serif", fontWeight: 700,
                                    fontSize: "clamp(0.95rem,2.5vw,1.12rem)", color: "#fff",
                                    margin: "0 0 0.45rem", letterSpacing: "-0.02em",
                                }}>{title}</h3>
                                <p style={{
                                    fontFamily: "'DM Sans',sans-serif", fontSize: "0.87rem",
                                    color: "rgba(255,255,255,0.46)", lineHeight: 1.75, margin: 0,
                                }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Tech Stack ───────────────────────────────────────────────────────────────

function TechStack() {
    return (
        <section id="tech-stack" style={{ padding: "5rem 1.25rem", maxWidth: 1000, margin: "0 auto" }}>
            <SectionLabel text="Tech Stack" />
            <h2 style={sectionTitle}>Built with production-grade tools</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
                gap: "0.9rem", marginTop: "2.5rem",
            }}>
                {STACK.map(({ name, role, detail, emoji }) => (
                    <div key={name} style={{
                        display: "flex", alignItems: "center", gap: "0.9rem",
                        padding: "1.1rem 1.25rem", borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.07)",
                        background: "rgba(255,255,255,0.025)",
                        transition: "border-color 0.2s", cursor: "default",
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                    >
                        <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{emoji}</span>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: "'Syne',sans-serif", fontWeight: 700,
                                fontSize: "0.9rem", color: "#fff", letterSpacing: "-0.01em",
                            }}>{name}</div>
                            <div style={{
                                fontFamily: "'DM Mono',monospace", fontSize: "0.63rem",
                                color: "#06b6d4", letterSpacing: "0.08em",
                                textTransform: "uppercase", marginTop: 2,
                            }}>{role}</div>
                            <div style={{
                                fontFamily: "'DM Sans',sans-serif", fontSize: "0.77rem",
                                color: "rgba(255,255,255,0.36)", marginTop: 3,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{detail}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Architecture flow */}
            <div style={{
                marginTop: "2.25rem", padding: "1.2rem 1.5rem", borderRadius: 14,
                border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.05)",
                fontFamily: "'DM Mono',monospace", fontSize: "clamp(0.68rem,1.8vw,0.8rem)",
                color: "rgba(255,255,255,0.55)", lineHeight: 2.1,
                letterSpacing: "0.02em", overflowX: "auto",
            }}>
                <span style={{ color: "#a5b4fc", fontWeight: 700 }}>Data Flow: </span>
                React (Vite){" "}<span style={{ color: "#6366f1" }}>→</span>{" "}Express API{" "}
                <span style={{ color: "#6366f1" }}>→</span>{" "}Firebase Admin SDK{" "}
                <span style={{ color: "#6366f1" }}>→</span>{" "}Firestore / Storage
                {"  |  "}
                MetaMask + ethers.js{" "}<span style={{ color: "#6366f1" }}>→</span>{" "}
                <span style={{ color: "#8b5cf6" }}>Ethereum Sepolia</span>{" "}
                <span style={{ color: "#6366f1" }}>→</span>{" "}Etherscan proof link
            </div>
        </section>
    );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
    const [open, setOpen] = useState(null);
    return (
        <section id="faq" style={{
            padding: "5rem 1.25rem",
            background: "rgba(255,255,255,0.015)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
                <SectionLabel text="FAQ" />
                <h2 style={sectionTitle}>Common questions</h2>
                <div style={{ marginTop: "2.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {FAQS.map(({ q, a }, i) => (
                        <div key={i} onClick={() => setOpen(open === i ? null : i)} style={{
                            borderRadius: 12,
                            border: `1px solid ${open === i ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                            background: open === i ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.025)",
                            overflow: "hidden", transition: "border-color 0.2s,background 0.2s", cursor: "pointer",
                        }}>
                            <div style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "center", padding: "1rem 1.25rem",
                            }}>
                                <span style={{
                                    fontFamily: "'Syne',sans-serif", fontWeight: 600,
                                    fontSize: "clamp(0.84rem,2vw,0.94rem)",
                                    color: "#fff", paddingRight: "0.5rem",
                                }}>{q}</span>
                                <span style={{
                                    color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", flexShrink: 0,
                                    transition: "transform 0.25s",
                                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                                }}>+</span>
                            </div>
                            {open === i && (
                                <div style={{
                                    padding: "0 1.25rem 1rem",
                                    fontFamily: "'DM Sans',sans-serif", fontSize: "0.86rem",
                                    color: "rgba(255,255,255,0.48)", lineHeight: 1.75,
                                }}>{a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
    const navigate = useNavigate();
    return (
        <footer style={{ padding: "2.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{
                maxWidth: 1000, margin: "0 auto",
                display: "flex", flexWrap: "wrap",
                justifyContent: "space-between", alignItems: "center", gap: "1.25rem",
            }}>
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                    }}>⛓️</div>
                    <span style={{
                        fontFamily: "'Syne',sans-serif", fontWeight: 800,
                        fontSize: "0.9rem", color: "#fff",
                    }}>DocChain</span>
                </div>

                <p style={{
                    fontFamily: "'DM Mono',monospace", fontSize: "0.66rem",
                    color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em",
                    margin: 0, textAlign: "center",
                }}>
                    Vite · React · Express · Firebase · Ethereum Sepolia
                </p>

                {/* Footer auth buttons */}
                <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => navigate("/login")} style={{
                        padding: "7px 15px", borderRadius: 7,
                        border: "1px solid rgba(255,255,255,0.14)", background: "transparent",
                        color: "rgba(255,255,255,0.55)", fontFamily: "'DM Mono',monospace",
                        fontSize: "0.7rem", cursor: "pointer", transition: "color 0.2s, border-color 0.2s",
                    }}
                        onMouseEnter={(e) => { e.target.style.color = "#fff"; e.target.style.borderColor = "rgba(255,255,255,0.32)"; }}
                        onMouseLeave={(e) => { e.target.style.color = "rgba(255,255,255,0.55)"; e.target.style.borderColor = "rgba(255,255,255,0.14)"; }}
                    >Log in</button>
                    <button onClick={() => navigate("/register")} style={{
                        padding: "7px 15px", borderRadius: 7,
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        border: "none", color: "#fff", fontFamily: "'DM Mono',monospace",
                        fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                    }}>Register →</button>
                </div>
            </div>
        </footer>
    );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ text }) {
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'DM Mono',monospace", fontSize: "0.68rem",
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: "#06b6d4", marginBottom: "0.85rem",
        }}>
            <span style={{ width: 18, height: 1, background: "#06b6d4", display: "inline-block" }} />
            {text}
            <span style={{ width: 18, height: 1, background: "#06b6d4", display: "inline-block" }} />
        </div>
    );
}

const sectionTitle = {
    fontFamily: "'Syne',sans-serif",
    fontWeight: 900,
    fontSize: "clamp(1.55rem, 3.5vw, 2.4rem)",
    color: "#fff",
    letterSpacing: "-0.04em",
    lineHeight: 1.1,
    margin: 0,
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Landing() {
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #060914; color: #fff; min-height: 100vh; }

        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #060914; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }

        /* Responsive helpers */
        @media (max-width: 768px) {
          .dc-desktop-nav { display: none !important; }
          .dc-hamburger   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .dc-mobile-menu { display: none !important; }
        }
      `}</style>

            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <TechStack />
            <FAQ />
            <Footer />
        </>
    );
}