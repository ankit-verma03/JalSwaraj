// Article detail page

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

export default function ArticleDetail() {
    const { slug } = useParams();
    const [a, setA] = useState(null);
    const [notFound, setNotFound] = useState(false);
    useEffect(() => { api.get(`/articles/${slug}`).then((r) => setA(r.data)).catch(() => setNotFound(true)); }, [slug]);

    if (notFound) return <p className="p-10 text-center">Article not found. <Link className="text-aqua" to="/articles">Back to articles</Link></p>;
    if (!a) return <p className="p-10 text-center">Loading…</p>;
    return (
        <article className="max-w-2xl mx-auto px-4 py-10 bg-white/90 rounded-2xl my-6 shadow">
            <Link to="/articles" className="text-aqua text-sm">← All articles</Link>
            <h1 className="text-3xl font-bold text-ocean mt-2">{a.title}</h1>
            <p className="text-sm text-slate-500">{a.category} · {a.reading_minutes} min read · {new Date(a.published_at).toLocaleDateString()}</p>
            <div className="mt-6 space-y-4 leading-relaxed">{a.body.split("\n").map((p, i) => <p key={i}>{p}</p>)}</div>
            {a.actions.length > 0 && <>
                <h2 className="mt-8 font-bold text-ocean">Practical actions</h2>
                <ul className="list-disc ml-6">{a.actions.map((x) => <li key={x}>{x}</li>)}</ul></>}
        </article>
    );
}