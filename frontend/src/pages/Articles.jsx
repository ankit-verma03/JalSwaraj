// Articles page

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";

export default function Articles() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/articles", { params: { search: search || undefined, category: category || undefined } })
            .then((r) => { setItems(r.data); setErr(""); }).catch((e) => setErr(errorMessage(e)));
    }, [search, category]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-ocean">Water Articles</h1>
            <div className="mt-4 flex gap-3 flex-wrap">
                <input aria-label="Search articles" placeholder="Search title" className="border rounded px-3 py-2" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select aria-label="Category" className="border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">All categories</option><option>Awareness</option><option>Practical</option><option>Community</option>
                </select>
            </div>
            {err && <p role="alert" className="mt-4 text-red-700">{err}</p>}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                    <article key={a.slug} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                        <div className="h-32 bg-gradient-to-br from-aqua to-turq" role="img" aria-label={`Cover for ${a.title}`} />
                        <div className="p-5 flex-1 flex flex-col">
                            <span className="text-xs text-aqua font-semibold">{a.category} · {a.reading_minutes} min read</span>
                            <h2 className="font-bold text-ocean mt-1">{a.title}</h2>
                            <p className="text-sm mt-2 flex-1">{a.summary}</p>
                            <Link to={`/articles/${a.slug}`} className="mt-3 text-aqua font-semibold">Read More →</Link>
                        </div>
                    </article>))}
            </div>
            {!err && items.length === 0 && <p className="mt-8">No articles found. Run <code>python seed_articles.py</code> in the backend.</p>}
        </div>
    );
}