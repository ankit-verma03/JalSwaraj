// Register page

import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";

const TYPES = ["1BHK", "2BHK", "3BHK", "4BHK", "other"];
const STEPS = ["Society", "Flats", "Occupancy", "Water setup", "Committee account"];

const initial = {
    society: {
        society_name: "", address: "", locality: "", city: "Mumbai", state: "Maharashtra", pin_code: "",
        registration_identifier: "", establishment_year: "", total_area: "", area_unit: "sqm", total_buildings: "",
        total_floors: "", total_flats: "", occupied_flats: "", actual_residents: "",
        flat_categories: TYPES.map((t) => ({ flat_type: t, flat_count: 0, average_residents_per_flat: 0 })),
        infrastructure: [
            { source_type: "municipal", available: true, meter_available: false, measurement_method: "estimated" },
            { source_type: "tanker", available: false, meter_available: false, measurement_method: "estimated" },
            { source_type: "rainwater_harvesting", available: false, meter_available: false, measurement_method: "unavailable" },
        ]
    },
    committee: { full_name: "", email: "", mobile_number: "", user_id: "", password: "", confirm_password: "", accepted_terms: false },
};

const num = (v) => (v === "" || v == null ? null : Number(v));

// IMPORTANT: Defined OUTSIDE Register — prevents remount on every render which caused focus loss
function Field({ label, path, type = "text", obj = "society", form, onChange, errors, ...rest }) {
    return (
        <label className="block text-sm">
            {label}
            <input
                type={type}
                className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aqua"
                value={form[obj][path]}
                onChange={(e) => onChange(obj, path, e.target.value)}
                {...rest}
            />
            {errors[`${obj}.${path}`] && (
                <span className="text-red-600 text-xs block mt-0.5">{errors[`${obj}.${path}`]}</span>
            )}
        </label>
    );
}

export default function Register() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    const setS = (k, v) => setForm((f) => ({ ...f, society: { ...f.society, [k]: v } }));
    const setC = (k, v) => setForm((f) => ({ ...f, committee: { ...f.committee, [k]: v } }));
    const setCat = (i, k, v) => setForm((f) => {
        const cats = f.society.flat_categories.map((c, j) => (j === i ? { ...c, [k]: v } : c));
        return { ...f, society: { ...f.society, flat_categories: cats } };
    });
    const setInfra = (i, k, v) => setForm((f) => ({
        ...f, society: {
            ...f.society,
            infrastructure: f.society.infrastructure.map((x, j) => (j === i ? { ...x, [k]: v } : x))
        }
    }));

    // Unified onChange handler for Field
    const handleChange = (obj, path, value) => (obj === "society" ? setS : setC)(path, value);

    const catSum = form.society.flat_categories.reduce((a, c) => a + Number(c.flat_count || 0), 0);

    const localCheck = () => {
        const e = {}; const s = form.society; const c = form.committee;
        if (step === 0) {
            if (!s.society_name.trim()) e["society.society_name"] = "Required";
            if (!s.address.trim()) e["society.address"] = "Required";
            if (!s.locality.trim()) e["society.locality"] = "Required";
            if (!/^\d{6}$/.test(s.pin_code)) e["society.pin_code"] = "Enter a 6-digit PIN code";
            if (!(Number(s.total_buildings) >= 1)) e["society.total_buildings"] = "At least 1";
            if (!(Number(s.total_flats) >= 1)) e["society.total_flats"] = "At least 1";
        }
        if (step === 1 && catSum !== Number(s.total_flats)) e.flats = `Flat categories add up to ${catSum}, but total flats is ${s.total_flats || 0}. Please correct one of them.`;
        if (step === 2 && !(Number(s.actual_residents) >= 1)) e["society.actual_residents"] = "Enter the actual number of residents";
        if (step === 4) {
            if (!c.full_name.trim()) e["committee.full_name"] = "Required";
            if (!/^\S+@\S+\.\S+$/.test(c.email)) e["committee.email"] = "Enter a valid email";
            if (!/^[A-Za-z0-9_.-]{4,30}$/.test(c.user_id)) e["committee.user_id"] = "4-30 letters, numbers, . _ -";
            if (c.password.length < 8 || !/[A-Za-z]/.test(c.password) || !/\d/.test(c.password)) e["committee.password"] = "At least 8 characters with a letter and a number";
            if (c.password !== c.confirm_password) e["committee.confirm_password"] = "Passwords do not match";
            if (!c.accepted_terms) e["committee.accepted_terms"] = "You must accept the terms";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => localCheck() && setStep(step + 1);

    const submit = async () => {
        if (!localCheck()) return;
        setBusy(true); setMsg("");
        const s = form.society;
        const payload = {
            society: {
                ...s,
                establishment_year: num(s.establishment_year), total_area: num(s.total_area),
                total_buildings: num(s.total_buildings), total_floors: num(s.total_floors),
                total_flats: num(s.total_flats), occupied_flats: num(s.occupied_flats), actual_residents: num(s.actual_residents),
                registration_identifier: s.registration_identifier || null,
                flat_categories: s.flat_categories.map((c) => ({ ...c, flat_count: Number(c.flat_count), average_residents_per_flat: Number(c.average_residents_per_flat) }))
            },
            committee: { ...form.committee, mobile_number: form.committee.mobile_number || null }
        };
        try { await api.post("/auth/register", payload); setDone(true); }
        catch (err) {
            const d = err.response?.data?.detail;
            if (Array.isArray(d)) {
                const e = {};
                d.forEach((x) => { e[x.loc.slice(1).join(".")] = x.msg.replace("Value error, ", ""); });
                setErrors(e); setMsg("Please fix the highlighted fields.");
            } else setMsg(errorMessage(err));
        } finally { setBusy(false); }
    };

    if (done) return (
        <div className="max-w-lg mx-auto p-10 text-center">
            <h1 className="text-2xl font-bold text-ocean">Society registered</h1>
            <p className="mt-2">Your committee account has been created.</p>
            <Link to="/login" className="inline-block mt-4 px-5 py-2 rounded-lg bg-ocean text-white">Go to login</Link>
        </div>);

    // Shared props for Field — stable references, no remounting
    const fp = { form, onChange: handleChange, errors };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-ocean">Register Society</h1>
            <ol className="flex gap-2 my-4 text-xs flex-wrap">
                {STEPS.map((s, i) => <li key={s} className={`px-2 py-1 rounded ${i === step ? "bg-ocean text-white" : "bg-slate-200"}`}>{i + 1}. {s}</li>)}
            </ol>
            <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                {msg && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded">{msg}</p>}

                {step === 0 && <>
                    <Field label="Society name" path="society_name" {...fp} />
                    <Field label="Complete address" path="address" {...fp} />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Locality" path="locality" {...fp} />
                        <Field label="PIN code" path="pin_code" inputMode="numeric" maxLength={6} {...fp} />
                        <Field label="City" path="city" {...fp} />
                        <Field label="State" path="state" {...fp} />
                        <Field label="Registration number (optional)" path="registration_identifier" {...fp} />
                        <Field label="Year established (optional)" path="establishment_year" type="number" {...fp} />
                        <Field label="Total premises area (optional)" path="total_area" type="number" {...fp} />
                        <label className="block text-sm">Area unit
                            <select className="mt-1 w-full border rounded px-3 py-2" value={form.society.area_unit} onChange={(e) => setS("area_unit", e.target.value)}>
                                <option value="sqm">Square metres</option><option value="sqft">Square feet</option>
                            </select>
                        </label>
                        <Field label="Buildings / wings" path="total_buildings" type="number" {...fp} />
                        <Field label="Floors (optional)" path="total_floors" type="number" {...fp} />
                        <Field label="Total flats" path="total_flats" type="number" {...fp} />
                        <Field label="Occupied flats (if known)" path="occupied_flats" type="number" {...fp} />
                    </div>
                </>}

                {step === 1 && <>
                    <p className="text-sm">Enter the flats in each category. Total so far: <strong>{catSum}</strong> of {form.society.total_flats || 0} declared.</p>
                    {errors.flats && <p role="alert" className="text-red-600 text-sm">{errors.flats}</p>}
                    {form.society.flat_categories.map((c, i) => (
                        <div key={c.flat_type} className="grid grid-cols-3 gap-3 items-end">
                            <span className="font-semibold">{c.flat_type}</span>
                            <label className="text-sm">Flats
                                <input type="number" min="0" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                                    value={c.flat_count} onChange={(e) => setCat(i, "flat_count", e.target.value)} />
                            </label>
                            <label className="text-sm">Avg residents
                                <input type="number" min="0" step="0.1" className="w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-aqua"
                                    value={c.average_residents_per_flat} onChange={(e) => setCat(i, "average_residents_per_flat", e.target.value)} />
                            </label>
                        </div>
                    ))}
                </>}

                {step === 2 && <>
                    <Field label="Actual total number of residents" path="actual_residents" type="number" {...fp} />
                    <p className="text-xs text-slate-600">This figure is used for litres/person/day. Flat-type averages are only used for estimates.</p>
                </>}

                {step === 3 && <>
                    <p className="text-sm">Water sources and measurement quality</p>
                    {form.society.infrastructure.map((x, i) => (
                        <div key={x.source_type} className="border rounded p-3 grid grid-cols-2 gap-2 text-sm">
                            <span className="font-semibold col-span-2">{x.source_type.replace(/_/g, " ")}</span>
                            <label><input type="checkbox" checked={x.available} onChange={(e) => setInfra(i, "available", e.target.checked)} /> Available</label>
                            <label><input type="checkbox" checked={x.meter_available} onChange={(e) => setInfra(i, "meter_available", e.target.checked)} /> Meter available</label>
                            <label className="col-span-2">Data quality
                                <select className="ml-2 border rounded px-2 py-1" value={x.measurement_method} onChange={(e) => setInfra(i, "measurement_method", e.target.value)}>
                                    <option value="measured">Measured</option><option value="estimated">Estimated</option><option value="unavailable">Unavailable</option>
                                </select>
                            </label>
                        </div>
                    ))}
                </>}

                {step === 4 && <>
                    <Field label="Representative's full name" obj="committee" path="full_name" {...fp} />
                    <Field label="Email" obj="committee" path="email" type="email" {...fp} />
                    <Field label="Mobile number (optional)" obj="committee" path="mobile_number" {...fp} />
                    <Field label="User ID" obj="committee" path="user_id" autoComplete="username" {...fp} />
                    <Field label="Password" obj="committee" path="password" type="password" autoComplete="new-password" {...fp} />
                    <Field label="Confirm password" obj="committee" path="confirm_password" type="password" autoComplete="new-password" {...fp} />
                    <label className="text-sm flex gap-2">
                        <input type="checkbox" checked={form.committee.accepted_terms} onChange={(e) => setC("accepted_terms", e.target.checked)} />
                        I agree to the data and privacy terms. Only society-level metrics are shown publicly.
                    </label>
                    {errors["committee.accepted_terms"] && <span className="text-red-600 text-xs">{errors["committee.accepted_terms"]}</span>}
                </>}

                <div className="flex justify-between pt-2">
                    <button disabled={step === 0} onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded disabled:opacity-40">Back</button>
                    {step < 4
                        ? <button onClick={next} className="px-4 py-2 bg-ocean text-white rounded">Next</button>
                        : <button onClick={submit} disabled={busy} className="px-4 py-2 bg-ocean text-white rounded disabled:opacity-60">{busy ? "Registering…" : "Register"}</button>}
                </div>
            </div>
        </div>
    );
}
