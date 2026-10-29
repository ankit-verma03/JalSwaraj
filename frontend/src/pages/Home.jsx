// Home page

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Upload, SearchCheck, Trophy } from "lucide-react";
import api from "../services/api";

const reveal = {
    initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5 }
};

const story = [
    ["Water is essential for life", "Every home depends on a steady, shared supply."],
    ["Small wastage accumulates", "A few leaking taps across hundreds of flats can add up."],
    ["Monitoring makes it visible", "You cannot improve what your society does not measure."],
    ["Responsible societies reduce waste", "Tracking unexplained differences helps find problems early."],
    ["Community participation scales", "Many societies improving together create a shared effect."],
];
const steps = [
    [ClipboardList, "Register your society"], [Upload, "Submit water usage data"],
    [SearchCheck, "Understand consumption and discrepancies"], [Trophy, "Improve and compete"],
];

export default function Home() {
    const [lb, setLb] = useState(null);
    const [arts, setArts] = useState([]);
    useEffect(() => {
        api.get("/leaderboard", { params: { page_size: 3 } }).then((r) => setLb(r.data)).catch(() => setLb({ items: [], error: true }));
        api.get("/articles", { params: { limit: 3 } }).then((r) => setArts(r.data)).catch(() => { });
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4">
            <section className="py-20 md:py-28 text-center">
                <p className="text-aqua font-semibold tracking-wide">Every Drop Counts. Every Society Matters.</p>
                <h1 className="mt-3 text-4xl md:text-6xl font-extrabold text-ocean">Every Society Can Make Every Drop Count.</h1>
                <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-700">
                    Measure your water. Reduce unnecessary consumption. Hold your society accountable.
                    Join Mumbai's community water conservation movement.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    <Link to="/register" className="px-6 py-3 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90">Register Your Society</Link>
                    <Link to="/leaderboard" className="px-6 py-3 rounded-lg border-2 border-ocean text-ocean font-semibold bg-white/70">Explore Leaderboard</Link>
                </div>
            </section>

            {story.map(([t, d], i) => (
                <motion.section key={t} {...reveal} className="my-16 md:my-24 max-w-xl mx-auto bg-white/80 rounded-2xl p-6 shadow">
                    <p className="text-aqua font-bold">0{i + 1}</p>
                    <h2 className="text-2xl font-bold text-ocean">{t}</h2>
                    <p className="mt-2">{d}</p>
                </motion.section>
            ))}

            <motion.section {...reveal} className="my-16">
                <h2 className="text-3xl font-bold text-ocean text-center">How JalSwaraj works</h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map(([Icon, label], i) => (
                        <div key={label} className="bg-white rounded-xl p-5 shadow text-center">
                            <Icon className="mx-auto text-aqua" size={32} />
                            <p className="mt-3 font-semibold">{i + 1}. {label}</p>
                        </div>
                    ))}
                </div>
            </motion.section>

            <motion.section {...reveal} className="my-16 bg-white/90 rounded-2xl p-6 shadow">
                <h2 className="text-2xl font-bold text-ocean">Why accountability matters</h2>
                <p className="mt-2">Water entering a building should roughly match water recorded as used or stored. The difference, called unaccounted water, is a prompt to investigate. It is not proof of a leak or of wrongdoing.</p>
            </motion.section>

            <motion.section {...reveal} className="my-16">
                <h2 className="text-2xl font-bold text-ocean">Leaderboard preview</h2>
                {lb?.items?.length ? (
                    <ol className="mt-4 space-y-2">
                        {lb.items.map((s) => (
                            <li key={s.society_id} className="bg-white rounded-lg p-4 shadow flex justify-between">
                                <span>#{s.rank} {s.society_name} {s.is_demo && <em className="text-xs text-amber-600">(demo data)</em>}</span>
                                <strong>{s.overall_score}</strong>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <div className="mt-4 bg-white rounded-xl p-8 text-center shadow">
                        <p className="text-xl font-semibold text-ocean">The conservation challenge starts here.</p>
                        <p className="mt-1">Register your society and establish your first water conservation baseline.</p>
                        <Link to="/register" className="inline-block mt-4 px-5 py-2 rounded-lg bg-aqua text-white">Register Society</Link>
                    </div>
                )}
            </motion.section>

            <motion.section {...reveal} className="my-16 bg-white/90 rounded-2xl p-6 shadow">
                <h2 className="text-2xl font-bold text-ocean">Water impact <span className="text-sm font-normal text-amber-600">(illustrative example, not verified data)</span></h2>
                <p className="mt-2">If a hypothetical society of 400 residents lowered household use from 150 to 135 litres/person/day, that would be 6,000 fewer litres per day, or about 180,000 litres over a 30-day month. This is simple arithmetic, not a measured saving.</p>
            </motion.section>

            <motion.section {...reveal} className="my-16">
                <h2 className="text-2xl font-bold text-ocean">Featured articles</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {arts.map((a) => (
                        <article key={a.slug} className="bg-white rounded-xl p-5 shadow flex flex-col">
                            <span className="text-xs text-aqua font-semibold">{a.category}</span>
                            <h3 className="font-bold text-ocean mt-1">{a.title}</h3>
                            <p className="text-sm mt-2 flex-1">{a.summary}</p>
                            <Link to={`/articles/${a.slug}`} className="mt-3 text-aqua font-semibold">Read Article →</Link>
                        </article>
                    ))}
                </div>
            </motion.section>

            <section className="my-16 text-center">
                <h2 className="text-3xl font-bold text-ocean">Ready to make every drop count?</h2>
                <Link to="/register" className="inline-block mt-4 px-6 py-3 rounded-lg bg-ocean text-white font-semibold">Register Your Society</Link>
            </section>
        </div>
    );
}