// Dashboard overview page

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import api, { errorMessage } from "../services/api";
import ChartCard from "../components/ChartCard";

const fmt = (v, unit = "") => (v == null ? "n/a" : `${Math.round(v).toLocaleString()}${unit}`);

export default function DashOverview() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { api.get("/analytics/overview").then((r) => setData(r.data)).catch((e) => setErr(errorMessage(e))); }, []);

    if (err) return <p role="alert" className="text-red-700">{err}</p>;
    if (!data) return <p>Loading…</p>;
    const { latest: l, series } = data;
    const empty = series.length === 0;

    const cards = l ? [
        ["Total water input", fmt(l.total_water_input_litres, " L")],
        ["Household usage", fmt(l.household_water_litres, " L")],
        ["Household L/person/day", fmt(l.lpcd)],
        [`Household L/${l.flat_basis} flat/day`, fmt(l.lpfd)],
        ["Non-household use", fmt(l.non_household_water_litres, " L")],
        ["Unaccounted water", `${fmt(l.unaccounted_water_litres, " L")} (${l.unaccounted_percentage == null ? "n/a" : l.unaccounted_percentage.toFixed(1) + "%"})`],
        ["Change vs previous", l.improvement_pct == null ? "No baseline yet" : `${l.improvement_pct.toFixed(1)}%`],
        ["Data quality", `${l.data_quality}${l.balance_approximate ? " (approx. balance)" : ""}`],
    ] : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ocean">Overview</h1>
            {empty && <div className="bg-white rounded-xl p-8 text-center shadow">
                <p className="font-semibold">No reports yet.</p>
                <Link to="/dashboard/water-reports" className="inline-block mt-3 px-4 py-2 bg-ocean text-white rounded">Submit your first report</Link></div>}
            {l?.balance_inconsistent && <p role="alert" className="p-3 bg-amber-50 text-amber-800 rounded">The latest report has inconsistent totals (usage exceeds available water). Verification required. It is not ranked.</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(([t, v]) => <div key={t} className="bg-white rounded-xl shadow p-4"><p className="text-xs text-slate-500">{t}</p><p className="text-lg font-bold text-ocean">{v}</p></div>)}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Household consumption (L)" description="Line chart of household water use per reporting period" empty={empty}>
                    <ResponsiveContainer><LineChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="household_litres" stroke="#1ca3c7" strokeWidth={2} /></LineChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Household litres/person/day" description="Line chart of daily household use per resident" empty={empty}>
                    <ResponsiveContainer><LineChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line dataKey="lpcd" stroke="#0b3c5d" strokeWidth={2} /></LineChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Total water input (L)" description="Bar chart of total water input per period" empty={empty}>
                    <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="total_input" fill="#5fd3c9" /></BarChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Non-household use (L)" description="Bar chart of gardening and other non-household use" empty={empty}>
                    <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="non_household" fill="#1ca3c7" /></BarChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Accounted vs unaccounted (L)" description="Stacked bars comparing accounted and unaccounted water" empty={empty}>
                    <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Legend />
                        <Bar dataKey="accounted" stackId="a" fill="#1ca3c7" /><Bar dataKey="unaccounted" stackId="a" fill="#f59e0b" /></BarChart></ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Improvement vs previous period (%)" description="Bar chart of percentage improvement" empty={empty || series.every((s) => s.improvement_pct == null)}>
                    <ResponsiveContainer><BarChart data={series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="improvement_pct" fill="#0b3c5d" /></BarChart></ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}