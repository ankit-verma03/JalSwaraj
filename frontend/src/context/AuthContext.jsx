// Authentication context

import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(null)).finally(() => setLoading(false));
        const onExpired = () => { setUser(null); setExpired(true); };
        window.addEventListener("auth:expired", onExpired);
        return () => window.removeEventListener("auth:expired", onExpired);
    }, []);

    const login = async (user_id, password) => {
        await api.post("/auth/login", { user_id, password });
        const r = await api.get("/auth/me");
        setUser(r.data); setExpired(false);
    };
    const logout = async () => { await api.post("/auth/logout"); setUser(null); };

    return <AuthContext.Provider value={{ user, loading, expired, login, logout }}>{children}</AuthContext.Provider>;
}