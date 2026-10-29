// ChartCard component

export default function ChartCard({ title, description, empty, children }) {
    return (
        <section className="bg-white rounded-xl shadow p-4" aria-label={title}>
            <h3 className="font-semibold text-ocean">{title}</h3>
            <p className="sr-only">{description}</p>
            {empty ? <p className="text-sm text-slate-500 py-10 text-center">No data yet. Submit a water report to see this chart.</p>
                : <div className="h-64 mt-2" role="img" aria-label={description}>{children}</div>}
        </section>
    );
}