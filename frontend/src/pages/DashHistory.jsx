// Dashboard history page

import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";

export default function DashHistory() {
    const [rows, setRows] = useState(null);
    const [hist, setHist] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { api.get("/water-reports").then((r) => setRows(r.data)).catch((e) => setErr(errorMessage(e))); }, []);

    const open = (id) => api.get(`/water-reports/${id}/history`).then((r) => setHist(r.data)).catch((e) => setErr(errorMessage(e)));

    if (!rows) return <p>{err || "Loading…"}</p>;
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-ocean">Reporting History</h1>
            {err && <p role="alert" className="text-red-700">{err}</p>}
            {rows.length === 0 && <p className="bg-white p-6 rounded-xl shadow">No reports submitted yet.</p>}
            <div className="overflow-x-auto bg-white rounded-xl shadow">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100"><tr><th className="p-2 text-left">Period</th><th>Household (L)</th><th>L/person/day</th><th>Unaccounted</th><th>Status</th><th></th></tr></thead>
                    <tbody>{rows.map((r) => (
                        <tr key={r.id} className="border-t text-center">
                            <td className="p-2 text-left">{r.period_start} to {r.period_end}</td>
                            <td>{Math.round(r.household_water_litres).toLocaleString()}</td>
                            <td>{r.lpcd?.toFixed(1) ?? "n/a"}</td>
                            <td>{r.unaccounted_percentage == null ? "n/a" : r.unaccounted_percentage.toFixed(1) + "%"}</td>
                            <td>{r.reporting_status}</td>
                            <td><button onClick={() => open(r.id)} className="text-aqua">Revisions</button></td>
                        </tr>))}</tbody>
                </table>
            </div>
            {hist && <div className="bg-white rounded-xl shadow p-4">
                <h2 className="font-semibold">Revision history for {hist.current.period_start} to {hist.current.period_end}</h2>
                {hist.revisions.length === 0 ? <p className="text-sm mt-2">No revisions. This is the original submission.</p>
                    : hist.revisions.map((v) => <p key={v.revision_number} className="text-sm mt-2">#{v.revision_number} on {new Date(v.changed_at).toLocaleString()}: {v.reason}</p>)}
            </div>}
        </div>
    );
}