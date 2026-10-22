// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ── Listen to Firebase auth state changes ──────────────────────────────────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser ?? null);
            setLoading(false);
        });
        return unsubscribe; // cleanup on unmount
    }, []);

    // ── Google sign-in / register (same popup flow) ────────────────────────────
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    };

    // ── Email + password login ─────────────────────────────────────────────────
    const loginWithEmail = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    };

    // ── Email + password register ──────────────────────────────────────────────
    const registerWithEmail = async (fullName, email, password) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Attach display name so user.displayName works everywhere
        await updateProfile(result.user, { displayName: fullName });
        // Reload so the updated profile is reflected immediately
        await result.user.reload();
        setUser(auth.currentUser);
        return auth.currentUser;
    };

    // ── Sign out ───────────────────────────────────────────────────────────────
    const logout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    // ── Get a fresh ID token to authenticate backend API calls ─────────────────
    const getIdToken = async () => {
        if (!auth.currentUser) return null;
        return auth.currentUser.getIdToken(/* forceRefresh */ false);
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        getIdToken,
    };

    if (loading) {
        return (
            <div style={{
                height: "100vh",
                background: "#060914",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.1rem",
                gap: "0.75rem",
            }}>
                <span style={{
                    width: 22, height: 22, border: "2px solid rgba(99,102,241,0.3)",
                    borderTopColor: "#6366f1", borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);