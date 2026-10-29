// Leaderboard page

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";

const COLS = [
    ["rank", "Rank"], ["society_name", "Society"], ["locality", "Locality"],
    ["total_water_input_litres", "Total input (L)"], ["household_water_litres", "Household use (L)"],
    ["lpcd", "L/person/day"], ["lpfd", "L/flat/day"], ["improvement_pct", "Improvement"],
    [null, "Accountability"], ["overall_score", "Score"],
];

export default function Leaderboard() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const [f, setF] = useState({ search: "", locality: "", period: "", sort_by: "rank", order: "asc", page: 1 });

    useEffect(() => {
        setLoading(true);
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
        api.get("/leaderboard", { params })
            .then((r) => { setData(r.data); setErr(""); })
            .catch((e) => setErr(errorMessage(e)))
            .finally(() => setLoading(false));
    }, [f]);

    const sort = (key) => key && setF({ ...f, sort_by: key, order: f.sort_by === key && f.order === "asc" ? "desc" : "asc", page: 1 });
    const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-ocean">Public Leaderboard</h1>
            <p className="text-sm text-slate-600 mt-1">Ranked by household use per person per day, improvement and accountability. Figures are self-reported and not independently verified.</p>

            <div className="mt-4 flex flex-wrap gap-3">
                <input aria-label="Search society" placeholder="Search society name" className="border rounded px-3 py-2"
                    value={f.search} onChange={(e) => setF({ ...f, search: e.target.value, page: 1 })} />
                <select aria-label="Locality" className="border rounded px-3 py-2" value={f.locality}
                    onChange={(e) => setF({ ...f, locality: e.target.value, page: 1 })}>
                    <option value="">All localities</option>
                    {data?.localities.map((l) => <option key={l}>{l}</option>)}
                </select>
                <input aria-label="Reporting period" type="month" className="border rounded px-3 py-2" value={f.period}
                    onChange={(e) => setF({ ...f, period: e.target.value, page: 1 })} />
            </div>

            {err && <p role="alert" className="mt-4 p-3 bg-red-50 text-red-700 rounded">{err}</p>}
            {loading && <p className="mt-6">Loading…</p>}

            {!loading && !err && data?.items.length === 0 && (
                <div className="mt-8 bg-white rounded-xl p-10 text-center shadow">
                    <p className="text-2xl font-semibold text-ocean">The conservation challenge starts here.</p>
                    <p className="mt-2">Register your society and establish your first water conservation baseline.</p>
                    <Link to="/register" className="inline-block mt-4 px-5 py-2 rounded-lg bg-aqua text-white">Register Society</Link>
                </div>
            )}

            {!loading && data?.items.length > 0 && (
                <>
                    <div className="mt-6 overflow-x-auto bg-white rounded-xl shadow">
                        <table className="min-w-full text-sm">
                            <thead className="bg-ocean text-white">
                                <tr>{COLS.map(([k, label]) => (
                                    <th key={label} scope="col" className="px-3 py-3 text-left whitespace-nowrap">
                                        {k ? <button onClick={() => sort(k)}>{label}{f.sort_by === k ? (f.order === "asc" ? " ▲" : " ▼") : ""}</button> : label}
                                    </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((s) => (
                                    <tr key={s.society_id} className="border-t">
                                        <td className="px-3 py-3 font-bold">{s.rank}</td>
                                        <td className="px-3 py-3">
                                            {s.society_name}
                                            {s.is_demo && <span className="ml-1 text-xs text-amber-600">(demo data)</span>}
                                            <div className="text-xs text-slate-500">{s.period_start} to {s.period_end} · {s.data_quality} · unverified</div>
                                        </td>
                                        <td className="px-3 py-3">{s.locality}</td>
                                        <td className="px-3 py-3">{s.total_water_input_litres.toLocaleString()}</td>
                                        <td className="px-3 py-3">{s.household_water_litres.toLocaleString()}</td>
                                        <td className="px-3 py-3">{s.lpcd}</td>
                                        <td className="px-3 py-3" title={`Per ${s.flat_basis} flat`}>{s.lpfd ?? "n/a"}</td>
                                        <td className="px-3 py-3">{s.baseline ? "Baseline" : s.improvement_pct == null ? "n/a" : `${s.improvement_pct}%`}</td>
                                        <td className="px-3 py-3">{s.accountability_status}</td>
                                        <td className="px-3 py-3 font-bold" title={JSON.stringify(s.components)}>{s.overall_score}</td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <button disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
                        <span>Page {f.page} of {pages}</span>
                        <button disabled={f.page >= pages} onClick={() => setF({ ...f, page: f.page + 1 })} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
                    </div>
                </>
            )}
        </div>
    );
}