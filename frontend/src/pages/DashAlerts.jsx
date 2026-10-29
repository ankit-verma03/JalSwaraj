// Dashboard alerts page

import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";

export default function DashAlerts() {
    const [alerts, setAlerts] = useState(null);
    const [err, setErr] = useState("");
    const [comments, setComments] = useState({});

    const load = () => api.get("/alerts").then((r) => setAlerts(r.data)).catch((e) => setErr(errorMessage(e)));
    useEffect(() => { load(); }, []);

    const setStatus = async (a, status) => {
        if (status === "resolved" && !window.confirm("Mark this alert as resolved?")) return;
        try { await api.patch(`/alerts/${a.id}`, { status, committee_comment: comments[a.id] || null }); load(); }
        catch (e) { setErr(errorMessage(e)); }
    };

    if (!alerts) return <p>{err || "Loading…"}</p>;
    return (
        <div className="space-y-4 max-w-3xl">
            <h1 className="text-2xl font-bold text-ocean">Alerts</h1>
            {err && <p role="alert" className="text-red-700">{err}</p>}
            {alerts.length === 0 && <p className="bg-white p-6 rounded-xl shadow">No alerts. Alerts appear after reports are analysed.</p>}
            {alerts.map((a) => (
                <article key={a.id} className="bg-white rounded-xl shadow p-4 space-y-2">
                    <p className="text-xs uppercase font-semibold text-aqua">{a.severity} · {a.status.replace("_", " ")}</p>
                    <p className="font-semibold">{a.message}</p>
                    <p className="text-sm"><strong>Why it may matter / what to check:</strong> {a.explanation}</p>
                    <p className="text-xs text-slate-500">Triggering data: {JSON.stringify(a.trigger_data)}</p>
                    {a.committee_comment && <p className="text-sm italic">Your note: {a.committee_comment}</p>}
                    {a.status !== "resolved" && <>
                        <textarea aria-label="Explanation" placeholder="Add an explanation (optional)" className="w-full border rounded px-2 py-1 text-sm"
                            value={comments[a.id] ?? ""} onChange={(e) => setComments({ ...comments, [a.id]: e.target.value })} />
                        <div className="flex gap-2">
                            <button onClick={() => setStatus(a, "under_review")} className="px-3 py-1 border rounded text-sm">Mark under review</button>
                            <button onClick={() => setStatus(a, "resolved")} className="px-3 py-1 bg-ocean text-white rounded text-sm">Mark resolved</button>
                        </div></>}
                </article>))}
        </div>
    );
}