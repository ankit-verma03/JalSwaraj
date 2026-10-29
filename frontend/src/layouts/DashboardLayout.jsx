// Dashboard layout

import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [["/dashboard", "Overview", true], ["/dashboard/water-reports", "Submit Water Report"],
["/dashboard/analytics", "Water Analytics"], ["/dashboard/alerts", "Alerts"], ["/dashboard/history", "Reporting History"]];

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const cls = ({ isActive }) => `block px-3 py-2 rounded ${isActive ? "bg-ocean text-white" : "hover:bg-aqua/10"}`;
    const out = async () => { if (window.confirm("Log out?")) { await logout(); nav("/"); } };

    return (
        <div className="min-h-screen md:flex bg-slate-50">
            <aside className="md:w-60 bg-white border-r p-4">
                <Link to="/" className="font-bold text-ocean text-xl">JalSwaraj</Link>
                <p className="text-xs text-slate-500 mt-1">{user.society.society_name}</p>
                <nav className="mt-4 flex md:flex-col gap-1 overflow-x-auto" aria-label="Dashboard">
                    {links.map(([to, l, end]) => <NavLink key={to} to={to} end={end} className={cls}>{l}</NavLink>)}
                    <button onClick={out} className="text-left px-3 py-2 rounded text-red-700 hover:bg-red-50">Logout</button>
                </nav>
            </aside>
            <main className="flex-1 p-4 md:p-8 min-w-0"><Outlet /></main>
        </div>
    );
}