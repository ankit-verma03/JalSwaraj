// Navbar component

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Droplets, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const links = [
        ["/", "Home"], ["/leaderboard", "Leaderboard"],
        user ? ["/dashboard", "Dashboard"] : ["/login", "Login"],
        ["/register", "Register Society"], ["/articles", "Water Articles"],
    ];
    const cls = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-ocean text-white" : "text-ocean hover:bg-aqua/10"}`;

    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
            <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16" aria-label="Main">
                <Link to="/" className="flex items-center gap-2 text-ocean font-bold text-xl">
                    <Droplets className="text-aqua" /> JalSwaraj
                </Link>
                <div className="hidden md:flex gap-1">
                    {links.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={cls}>{label}</NavLink>)}
                </div>
                <button className="md:hidden p-2" onClick={() => setOpen(!open)}
                    aria-label="Toggle menu" aria-expanded={open}>
                    {open ? <X /> : <Menu />}
                </button>
            </nav>
            {open && (
                <div className="md:hidden flex flex-col p-3 gap-1 border-t bg-white">
                    {links.map(([to, label]) => (
                        <NavLink key={to} to={to} end={to === "/"} className={cls} onClick={() => setOpen(false)}>{label}</NavLink>
                    ))}
                </div>
            )}
        </header>
    );
}