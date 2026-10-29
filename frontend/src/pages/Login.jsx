// Login page

import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

export default function Login() {
    const { login, expired } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (!userId.trim() || !password) return setErr("Please enter your User ID and password.");
        setBusy(true); setErr("");
        try { await login(userId.trim(), password); nav(loc.state?.from || "/dashboard", { replace: true }); }
        catch (e2) { setErr(errorMessage(e2)); }
        finally { setBusy(false); }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-14">
            <form onSubmit={submit} className="bg-white rounded-2xl shadow p-6 space-y-4" noValidate>
                <h1 className="text-2xl font-bold text-ocean">Committee Login</h1>
                {expired && <p role="alert" className="p-3 bg-amber-50 text-amber-800 rounded">Your session expired. Please log in again.</p>}
                {err && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded">{err}</p>}
                <label className="block">User ID
                    <input className="mt-1 w-full border rounded px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)} autoComplete="username" />
                </label>
                <label className="block">Password
                    <div className="relative">
                        <input className="mt-1 w-full border rounded px-3 py-2 pr-10" type={show ? "text" : "password"}
                            value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
                            className="absolute right-2 top-3.5">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                </label>
                <button disabled={busy} className="w-full py-2 rounded-lg bg-ocean text-white font-semibold flex justify-center gap-2 disabled:opacity-60">
                    {busy && <Loader2 className="animate-spin" size={18} />} Log in
                </button>
                <p className="text-sm">New society? <Link className="text-aqua font-semibold" to="/register">Register here</Link></p>
            </form>
        </div>
    );
}