// Report form page

import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";

const SOURCES = ["municipal", "tanker", "borewell", "recycled", "other"];
const NH = ["Gardening and plants", "Common-area cleaning", "Swimming pool", "Vehicle washing", "Maintenance", "Other common-area use"];
const METHODS = ["measured", "estimated", "unavailable"];

const blank = () => ({
    period_start: "", period_end: "", frequency: "monthly",
    sources: SOURCES.map((s) => ({ source: s, quantity: "", unit: "L", method: "estimated" })),
    household_quantity: "", household_unit: "L", household_method: "estimated",
    non_household: NH.map((c) => ({ category: c, quantity: "", unit: "L", method: "estimated" })),
    beginning_storage: "", ending_storage: "", storage_unit: "L", other_outflows: "", notes: "",
});
const n = (v) => (v === "" ? null : Number(v));

// IMPORTANT: Defined OUTSIDE ReportForm so React never remounts it on re-render (avoids focus loss)
function Row({ r, i, groupKey, onUpdate }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end text-sm">
            <span className="font-medium capitalize">{r.source || r.category}</span>
            <input
                aria-label={`${r.source || r.category} quantity`}
                type="number" min="0"
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                value={r.quantity}
                onChange={(e) => onUpdate(groupKey, i, "quantity", e.target.value)}
            />
            <select
                aria-label="unit"
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                value={r.unit}
                onChange={(e) => onUpdate(groupKey, i, "unit", e.target.value)}
            >
                <option value="L">litres</option>
                <option value="KL">kilolitres</option>
            </select>
            <select
                aria-label="method"
                className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                value={r.method}
                onChange={(e) => onUpdate(groupKey, i, "method", e.target.value)}
            >
                {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
        </div>
    );
}

export default function ReportForm() {
    const [f, setF] = useState(blank());
    const [review, setReview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [result, setResult] = useState(null);

    const upd = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
    const updRow = (key, i, k, v) =>
        setF((prev) => ({ ...prev, [key]: prev[key].map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));

    const payload = () => ({
        period_start: f.period_start, period_end: f.period_end, frequency: f.frequency,
        sources: f.sources.filter((s) => s.quantity !== "").map((s) => ({ ...s, quantity: Number(s.quantity) })),
        household_quantity: Number(f.household_quantity), household_unit: f.household_unit, household_method: f.household_method,
        non_household: f.non_household.filter((r) => r.quantity !== "").map((r) => ({ ...r, quantity: Number(r.quantity) })),
        beginning_storage: n(f.beginning_storage), ending_storage: n(f.ending_storage), storage_unit: f.storage_unit,
        other_outflows: Number(f.other_outflows || 0), notes: f.notes || null,
    });

    const toReview = () => {
        const p = payload();
        if (!p.period_start || !p.period_end) return setErr("Please enter the reporting period.");
        if (p.sources.length === 0) return setErr("Enter at least one water source quantity.");
        if (f.household_quantity === "") return setErr("Enter the household water usage.");
        setErr(""); setReview(true);
    };

    const submit = async () => {
        setBusy(true); setErr("");
        try { const r = await api.post("/water-reports", payload()); setResult(r.data); }
        catch (e) { setErr(errorMessage(e)); setReview(false); }
        finally { setBusy(false); }
    };

    if (result) {
        const r = result.report;
        return (
            <div className="space-y-4 max-w-2xl">
                <h1 className="text-2xl font-bold text-ocean">Report saved</h1>
                <div className="bg-white rounded-xl shadow p-4 text-sm space-y-1">
                    <p>Adjusted water available = {Math.round(r.adjusted_water_available_litres).toLocaleString()} L</p>
                    <p>Accounted water = {Math.round(r.accounted_water_litres).toLocaleString()} L</p>
                    <p>Unaccounted water = {Math.round(r.unaccounted_water_litres).toLocaleString()} L ({r.unaccounted_percentage == null ? "n/a" : r.unaccounted_percentage.toFixed(1) + "%"})</p>
                    <p>Household L/person/day = {r.lpcd?.toFixed(1) ?? "n/a"}</p>
                    {r.balance_approximate && <p className="text-amber-700">Storage data was missing, so this reconciliation is approximate.</p>}
                </div>
                {result.alerts.length > 0 && <div className="bg-amber-50 rounded-xl p-4"><p className="font-semibold">Alerts raised:</p>
                    <ul className="list-disc ml-5">{result.alerts.map((a) => <li key={a.id}>{a.message}</li>)}</ul>
                    <Link to="/dashboard/alerts" className="text-aqua font-semibold">Review alerts →</Link></div>}
                <button onClick={() => { setResult(null); setF(blank()); setReview(false); }} className="px-4 py-2 border rounded">Submit another</button>
            </div>);
    }

    if (review) {
        const p = payload();
        return (
            <div className="max-w-2xl space-y-3">
                <h1 className="text-2xl font-bold text-ocean">Review before submitting</h1>
                <pre className="bg-white p-4 rounded-xl shadow text-xs overflow-x-auto">{JSON.stringify(p, null, 2)}</pre>
                <p className="text-sm text-slate-600">Calculations are performed by the server after submission. Figures are self-reported.</p>
                {err && <p role="alert" className="text-red-700">{err}</p>}
                <div className="flex gap-3">
                    <button onClick={() => setReview(false)} className="px-4 py-2 border rounded">Edit</button>
                    <button onClick={submit} disabled={busy} className="px-4 py-2 bg-ocean text-white rounded disabled:opacity-60">{busy ? "Submitting…" : "Confirm and submit"}</button>
                </div>
            </div>);
    }

    return (
        <div className="max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold text-ocean">Submit Water Report</h1>
            {err && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded">{err}</p>}

            <fieldset className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-3 gap-3">
                <legend className="font-semibold px-1">A. Reporting period</legend>
                <label className="text-sm">Start
                    <input type="date" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.period_start} onChange={(e) => upd("period_start", e.target.value)} />
                </label>
                <label className="text-sm">End
                    <input type="date" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.period_end} onChange={(e) => upd("period_end", e.target.value)} />
                </label>
                <label className="text-sm">Frequency
                    <select className="w-full border rounded px-2 py-1" value={f.frequency} onChange={(e) => upd("frequency", e.target.value)}>
                        <option>monthly</option><option>weekly</option><option>daily</option>
                    </select>
                </label>
            </fieldset>

            <fieldset className="bg-white rounded-xl shadow p-4 space-y-2">
                <legend className="font-semibold px-1">B. Total water input (leave blank if none)</legend>
                <p className="text-xs text-slate-500">Only add recycled water here if it is measured separately and not already counted in another source.</p>
                {f.sources.map((r, i) => (
                    <Row key={r.source} r={r} i={i} groupKey="sources" onUpdate={updRow} />
                ))}
            </fieldset>

            <fieldset className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-3 gap-3">
                <legend className="font-semibold px-1">C. Household usage</legend>
                <label className="text-sm">Quantity
                    <input type="number" min="0" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.household_quantity} onChange={(e) => upd("household_quantity", e.target.value)} />
                </label>
                <label className="text-sm">Unit
                    <select className="w-full border rounded px-2 py-1" value={f.household_unit} onChange={(e) => upd("household_unit", e.target.value)}>
                        <option value="L">litres</option><option value="KL">kilolitres</option>
                    </select>
                </label>
                <label className="text-sm">Method
                    <select className="w-full border rounded px-2 py-1" value={f.household_method} onChange={(e) => upd("household_method", e.target.value)}>
                        {METHODS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                </label>
            </fieldset>

            <fieldset className="bg-white rounded-xl shadow p-4 space-y-2">
                <legend className="font-semibold px-1">D. Non-household usage</legend>
                {f.non_household.map((r, i) => (
                    <Row key={r.category} r={r} i={i} groupKey="non_household" onUpdate={updRow} />
                ))}
            </fieldset>

            <fieldset className="bg-white rounded-xl shadow p-4 grid sm:grid-cols-4 gap-3">
                <legend className="font-semibold px-1">E. Storage and adjustments</legend>
                <label className="text-sm">Beginning tank volume
                    <input type="number" min="0" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.beginning_storage} onChange={(e) => upd("beginning_storage", e.target.value)} />
                </label>
                <label className="text-sm">Ending tank volume
                    <input type="number" min="0" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.ending_storage} onChange={(e) => upd("ending_storage", e.target.value)} />
                </label>
                <label className="text-sm">Unit
                    <select className="w-full border rounded px-2 py-1" value={f.storage_unit} onChange={(e) => upd("storage_unit", e.target.value)}>
                        <option value="L">litres</option><option value="KL">kilolitres</option>
                    </select>
                </label>
                <label className="text-sm">Other documented outflows (L)
                    <input type="number" min="0" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                        value={f.other_outflows} onChange={(e) => upd("other_outflows", e.target.value)} />
                </label>
                <p className="sm:col-span-4 text-xs text-slate-500">If storage volumes are missing, the balance is marked approximate.</p>
            </fieldset>

            <label className="block text-sm">F. Notes (leaks, events, missing readings)
                <textarea className="w-full border rounded px-2 py-1 mt-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                    rows={3} value={f.notes} onChange={(e) => upd("notes", e.target.value)} />
            </label>

            <button onClick={toReview} className="px-5 py-2 bg-ocean text-white rounded-lg">Review report</button>
        </div>
    );
}
