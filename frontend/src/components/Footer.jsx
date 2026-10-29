// Footer component

import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="bg-ocean text-white mt-16">
            <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 md:grid-cols-3 text-sm">
                <div>
                    <p className="font-bold text-lg">JalSwaraj</p>
                    <p className="mt-2 text-white/80">A student project for community water accountability. Figures are self-reported by societies and are not independently verified.</p>
                </div>
                <div className="flex flex-col gap-1">
                    <Link to="/leaderboard">Leaderboard</Link>
                    <Link to="/articles">Water Articles</Link>
                    <Link to="/register">Register Society</Link>
                </div>
                <div className="text-white/80">
                    <p>Privacy policy and Terms: add pages and link them here.</p>
                </div>
            </div>
        </footer>
    );
}