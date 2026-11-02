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

// Defined OUTSIDE Register so React never remounts inputs on re-render (avoids losing focus)
function Field({ label, path, type = "text", obj = "society", form, onChange, errors, ...rest }) {
    const errorKey = `${obj}.${path}`;
    const error = errors[errorKey];

    return (
        <label className="block text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <input
                type={type}
                className={`mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${
                    error ? "border-red-500 focus:ring-red-300 bg-red-50/20" : "border-slate-300 focus:ring-aqua"
                }`}
                value={form[obj][path] ?? ""}
                onChange={(e) => onChange(obj, path, e.target.value)}
                {...rest}
            />
            {error && (
                <span className="text-red-600 text-xs font-medium block mt-1">{error}</span>
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

    const handleChange = (obj, path, value) => {
        // Clear field error on change
        if (errors[`${obj}.${path}`]) {
            setErrors((prev) => {
                const nextErr = { ...prev };
                delete nextErr[`${obj}.${path}`];
                return nextErr;
            });
        }
        (obj === "society" ? setS : setC)(path, value);
    };

    const catSum = form.society.flat_categories.reduce((a, c) => a + Number(c.flat_count || 0), 0);

    // Validation for an individual step
    const validateStep = (stepIdx) => {
        const e = {};
        const s = form.society;
        const c = form.committee;

        if (stepIdx === 0) {
            if (!s.society_name.trim() || s.society_name.trim().length < 2) {
                e["society.society_name"] = "Society name must be at least 2 characters";
            }
            if (!s.address.trim() || s.address.trim().length < 5) {
                e["society.address"] = "Address must be at least 5 characters";
            }
            if (!s.locality.trim() || s.locality.trim().length < 2) {
                e["society.locality"] = "Locality must be at least 2 characters";
            }
            if (!/^\d{6}$/.test(s.pin_code)) {
                e["society.pin_code"] = "Enter a valid 6-digit PIN code";
            }
            if (s.establishment_year && (Number(s.establishment_year) < 1800 || Number(s.establishment_year) > 2100)) {
                e["society.establishment_year"] = "Year must be between 1800 and 2100";
            }
            if (s.total_area && Number(s.total_area) <= 0) {
                e["society.total_area"] = "Area must be greater than 0";
            }
            if (!s.total_buildings || Number(s.total_buildings) < 1) {
                e["society.total_buildings"] = "At least 1 building is required";
            }
            if (s.total_floors && Number(s.total_floors) < 1) {
                e["society.total_floors"] = "Floors must be at least 1";
            }
            if (!s.total_flats || Number(s.total_flats) < 1) {
                e["society.total_flats"] = "Total flats must be at least 1";
            }
            if (s.occupied_flats !== "" && s.occupied_flats != null) {
                if (Number(s.occupied_flats) < 0) {
                    e["society.occupied_flats"] = "Occupied flats cannot be negative";
                } else if (Number(s.occupied_flats) > Number(s.total_flats)) {
                    e["society.occupied_flats"] = "Occupied flats cannot exceed total flats";
                }
            }
        }

        if (stepIdx === 1) {
            const totalFlatsNum = Number(s.total_flats || 0);
            if (catSum !== totalFlatsNum) {
                e.flats = `Flat categories total (${catSum}) does not match declared Total Flats (${totalFlatsNum}). Please adjust the counts.`;
            }
            s.flat_categories.forEach((cat, idx) => {
                if (Number(cat.flat_count) < 0) {
                    e[`flats.${idx}.flat_count`] = "Cannot be negative";
                }
                if (Number(cat.average_residents_per_flat) < 0 || Number(cat.average_residents_per_flat) > 20) {
                    e[`flats.${idx}.avg`] = "Average residents must be between 0 and 20";
                }
            });
        }

        if (stepIdx === 2) {
            if (!s.actual_residents || Number(s.actual_residents) < 1) {
                e["society.actual_residents"] = "Actual residents must be at least 1";
            }
        }

        if (stepIdx === 4) {
            if (!c.full_name.trim() || c.full_name.trim().length < 2) {
                e["committee.full_name"] = "Full name must be at least 2 characters";
            }
            if (!/^\S+@\S+\.\S+$/.test(c.email)) {
                e["committee.email"] = "Enter a valid email address";
            }
            if (!/^[A-Za-z0-9_.-]{4,30}$/.test(c.user_id)) {
                e["committee.user_id"] = "User ID must be 4-30 characters (letters, numbers, '.', '_', '-')";
            }
            if (!c.password || c.password.length < 8 || !/[A-Za-z]/.test(c.password) || !/\d/.test(c.password)) {
                e["committee.password"] = "Password must be at least 8 characters and include at least one letter and one number";
            }
            if (c.password !== c.confirm_password) {
                e["committee.confirm_password"] = "Passwords do not match";
            }
            if (!c.accepted_terms) {
                e["committee.accepted_terms"] = "You must accept the terms and conditions to proceed";
            }
        }

        return e;
    };

    // Validates all steps across the entire form
    const validateAll = () => {
        let allErrors = {};
        let firstStepWithErr = null;

        for (let i = 0; i < STEPS.length; i++) {
            const stepErr = validateStep(i);
            if (Object.keys(stepErr).length > 0) {
                allErrors = { ...allErrors, ...stepErr };
                if (firstStepWithErr === null) {
                    firstStepWithErr = i;
                }
            }
        }

        return {
            valid: Object.keys(allErrors).length === 0,
            errors: allErrors,
            firstStepWithErr,
        };
    };

    const next = () => {
        const currentErrors = validateStep(step);
        if (Object.keys(currentErrors).length > 0) {
            setErrors(currentErrors);
            const firstMsg = Object.values(currentErrors)[0];
            setMsg(`Please fix the errors before continuing: ${firstMsg}`);
            return;
        }
        setErrors({});
        setMsg("");
        setStep(step + 1);
    };

    const submit = async () => {
        const check = validateAll();
        if (!check.valid) {
            setErrors(check.errors);
            const firstMsg = Object.values(check.errors)[0];
            // If the error is in another step, jump directly there so the user sees it
            if (check.firstStepWithErr !== step) {
                setStep(check.firstStepWithErr);
                setMsg(`Step ${check.firstStepWithErr + 1} (${STEPS[check.firstStepWithErr]}): ${firstMsg}`);
            } else {
                setMsg(`Please fix the errors below: ${firstMsg}`);
            }
            return;
        }

        setBusy(true);
        setMsg("");
        const s = form.society;
        const payload = {
            society: {
                ...s,
                establishment_year: num(s.establishment_year),
                total_area: num(s.total_area),
                total_buildings: num(s.total_buildings),
                total_floors: num(s.total_floors),
                total_flats: num(s.total_flats),
                occupied_flats: num(s.occupied_flats),
                actual_residents: num(s.actual_residents),
                registration_identifier: s.registration_identifier || null,
                flat_categories: s.flat_categories.map((c) => ({
                    ...c,
                    flat_count: Number(c.flat_count),
                    average_residents_per_flat: Number(c.average_residents_per_flat),
                })),
            },
            committee: {
                ...form.committee,
                mobile_number: form.committee.mobile_number || null,
            },
        };

        try {
            await api.post("/auth/register", payload);
            setDone(true);
        } catch (err) {
            const d = err.response?.data?.detail;
            if (Array.isArray(d)) {
                const e = {};
                let targetStep = 4;
                d.forEach((x) => {
                    const loc = x.loc.slice(1).join(".");
                    const cleanMsg = x.msg.replace("Value error, ", "");
                    e[loc] = cleanMsg;
                    // Determine which step has the error
                    if (loc.startsWith("society.flat_categories") || loc === "society") targetStep = 1;
                    else if (loc.startsWith("society.actual_residents")) targetStep = 2;
                    else if (loc.startsWith("society")) targetStep = 0;
                });
                setErrors(e);
                setStep(targetStep);
                setMsg(`Validation error in Step ${targetStep + 1}: ${d[0].msg.replace("Value error, ", "")}`);
            } else {
                const errText = errorMessage(err);
                if (errText.includes("already registered") || errText.includes("PIN code")) {
                    setStep(0);
                }
                setMsg(errText);
            }
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto p-10 text-center bg-white rounded-2xl shadow my-12">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                </div>
                <h1 className="text-2xl font-bold text-ocean mt-4">Society Registered Successfully!</h1>
                <p className="mt-2 text-slate-600">Your committee account has been created.</p>
                <Link to="/login" className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-ocean text-white font-semibold hover:bg-ocean/90 transition shadow">
                    Go to Login
                </Link>
            </div>
        );
    }

    const fp = { form, onChange: handleChange, errors };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-ocean">Register Society</h1>
            <p className="text-sm text-slate-600 mt-1">Complete the steps below to onboard your housing society.</p>

            {/* Stepper Navigation */}
            <ol className="flex gap-2 my-6 text-xs flex-wrap">
                {STEPS.map((s, i) => (
                    <li key={s}>
                        <button
                            type="button"
                            onClick={() => {
                                // Allow jumping back or to next if valid
                                if (i < step) {
                                    setStep(i);
                                    setMsg("");
                                } else if (i === step + 1) {
                                    next();
                                }
                            }}
                            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                                i === step
                                    ? "bg-ocean text-white shadow"
                                    : i < step
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-slate-200 text-slate-600 opacity-60"
                            }`}
                        >
                            {i + 1}. {s}
                        </button>
                    </li>
                ))}
            </ol>

            <div className="bg-white rounded-2xl shadow p-6 space-y-5 border border-slate-100">
                {/* Global Error Banner */}
                {msg && (
                    <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                        <span className="font-bold text-base leading-none">⚠️</span>
                        <span>{msg}</span>
                    </div>
                )}

                {/* STEP 0: Society Info */}
                {step === 0 && (
                    <div className="space-y-4">
                        <Field label="Society name *" path="society_name" placeholder="e.g. Green Meadows Co-op Housing Society" {...fp} />
                        <Field label="Complete address *" path="address" placeholder="e.g. Plot 42, Palm Avenue, Near Railway Station" {...fp} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Locality / Area *" path="locality" placeholder="e.g. Andheri West" {...fp} />
                            <Field label="PIN code (6 digits) *" path="pin_code" inputMode="numeric" maxLength={6} placeholder="400053" {...fp} />
                            <Field label="City *" path="city" {...fp} />
                            <Field label="State *" path="state" {...fp} />
                            <Field label="Registration number (optional)" path="registration_identifier" placeholder="e.g. BOM/HSG/1234/2010" {...fp} />
                            <Field label="Year established (optional)" path="establishment_year" type="number" placeholder="e.g. 2012" {...fp} />
                            <Field label="Total premises area (optional)" path="total_area" type="number" placeholder="e.g. 2500" {...fp} />
                            <label className="block text-sm">
                                <span className="font-medium text-slate-700">Area unit</span>
                                <select
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 bg-white"
                                    value={form.society.area_unit}
                                    onChange={(e) => setS("area_unit", e.target.value)}
                                >
                                    <option value="sqm">Square metres (sqm)</option>
                                    <option value="sqft">Square feet (sqft)</option>
                                </select>
                            </label>
                            <Field label="Buildings / wings *" path="total_buildings" type="number" min="1" placeholder="e.g. 2" {...fp} />
                            <Field label="Floors per building (optional)" path="total_floors" type="number" min="1" placeholder="e.g. 7" {...fp} />
                            <Field label="Total flats *" path="total_flats" type="number" min="1" placeholder="e.g. 50" {...fp} />
                            <Field label="Occupied flats (if known)" path="occupied_flats" type="number" min="0" placeholder="e.g. 48" {...fp} />
                        </div>
                    </div>
                )}

                {/* STEP 1: Flats Breakdown */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border text-sm flex justify-between items-center">
                            <span>Declared Total Flats: <strong className="text-ocean">{form.society.total_flats || 0}</strong></span>
                            <span>Categorized So Far: <strong className={catSum === Number(form.society.total_flats) ? "text-emerald-600" : "text-amber-600"}>{catSum}</strong></span>
                        </div>
                        {errors.flats && (
                            <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{errors.flats}</p>
                        )}
                        <div className="space-y-3">
                            {form.society.flat_categories.map((c, i) => (
                                <div key={c.flat_type} className="grid grid-cols-3 gap-3 items-end p-2 rounded-lg bg-slate-50/60 border border-slate-200">
                                    <span className="font-semibold text-ocean py-2">{c.flat_type}</span>
                                    <label className="text-sm">
                                        <span className="text-xs text-slate-500 block">Flats count</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full border rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-aqua bg-white"
                                            value={c.flat_count}
                                            onChange={(e) => setCat(i, "flat_count", e.target.value)}
                                        />
                                    </label>
                                    <label className="text-sm">
                                        <span className="text-xs text-slate-500 block">Avg residents</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            className="w-full border rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-aqua bg-white"
                                            value={c.average_residents_per_flat}
                                            onChange={(e) => setCat(i, "average_residents_per_flat", e.target.value)}
                                        />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Occupancy */}
                {step === 2 && (
                    <div className="space-y-4">
                        <Field label="Actual total number of residents *" path="actual_residents" type="number" min="1" placeholder="e.g. 180" {...fp} />
                        <p className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            ℹ️ This figure is used to calculate per-person consumption metrics (LPCD: Litres Per Capita per Day). Flat-type averages are only used for reference estimates.
                        </p>
                    </div>
                )}

                {/* STEP 3: Water Infrastructure */}
                {step === 3 && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">Select water sources available in your society and measurement methods:</p>
                        {form.society.infrastructure.map((x, i) => (
                            <div key={x.source_type} className="border border-slate-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-slate-50/50">
                                <span className="font-semibold text-ocean col-span-full capitalize">
                                    {x.source_type.replace(/_/g, " ")}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={x.available}
                                        onChange={(e) => setInfra(i, "available", e.target.checked)}
                                        className="rounded text-aqua focus:ring-aqua"
                                    />
                                    <span>Available in society</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={x.meter_available}
                                        onChange={(e) => setInfra(i, "meter_available", e.target.checked)}
                                        className="rounded text-aqua focus:ring-aqua"
                                    />
                                    <span>Meter installed</span>
                                </label>
                                <label className="col-span-full sm:col-span-1 mt-1">
                                    <span className="text-xs text-slate-500 block">Measurement method:</span>
                                    <select
                                        className="w-full border rounded px-2.5 py-1.5 bg-white text-sm mt-0.5"
                                        value={x.measurement_method}
                                        onChange={(e) => setInfra(i, "measurement_method", e.target.value)}
                                    >
                                        <option value="measured">Measured (Metered)</option>
                                        <option value="estimated">Estimated (Tanks/Hours)</option>
                                        <option value="unavailable">Unavailable</option>
                                    </select>
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 4: Committee Account */}
                {step === 4 && (
                    <div className="space-y-4">
                        <Field label="Representative's full name *" obj="committee" path="full_name" placeholder="e.g. Rajesh Sharma" {...fp} />
                        <Field label="Official email address *" obj="committee" path="email" type="email" placeholder="e.g. committee@greenmeadows.org" {...fp} />
                        <Field label="Mobile number (optional)" obj="committee" path="mobile_number" placeholder="e.g. 9876543210" {...fp} />
                        <Field label="User ID (for login) *" obj="committee" path="user_id" autoComplete="username" placeholder="e.g. rajesh_committee" {...fp} />
                        <Field label="Password (min 8 chars, 1 letter, 1 number) *" obj="committee" path="password" type="password" autoComplete="new-password" placeholder="••••••••" {...fp} />
                        <Field label="Confirm password *" obj="committee" path="confirm_password" type="password" autoComplete="new-password" placeholder="••••••••" {...fp} />
                        
                        <div className="pt-2">
                            <label className="text-sm flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.committee.accepted_terms}
                                    onChange={(e) => {
                                        setC("accepted_terms", e.target.checked);
                                        if (e.target.checked && errors["committee.accepted_terms"]) {
                                            setErrors((prev) => {
                                                const nextErr = { ...prev };
                                                delete nextErr["committee.accepted_terms"];
                                                return nextErr;
                                            });
                                        }
                                    }}
                                    className="mt-1 rounded text-aqua focus:ring-aqua"
                                />
                                <span className="text-slate-700">
                                    I agree to the data and privacy terms. I understand that only anonymized society-level water metrics will be visible on the public leaderboard.
                                </span>
                            </label>
                            {errors["committee.accepted_terms"] && (
                                <span className="text-red-600 text-xs font-semibold block mt-1.5 ml-6">
                                    {errors["committee.accepted_terms"]}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom error display (visible right next to buttons) */}
                {msg && step === 4 && (
                    <p className="text-red-600 text-sm font-medium pt-2">
                        ⚠️ {msg}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        disabled={step === 0 || busy}
                        onClick={() => {
                            setStep(step - 1);
                            setMsg("");
                        }}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    {step < 4 ? (
                        <button
                            type="button"
                            onClick={next}
                            className="px-5 py-2 bg-ocean text-white rounded-lg font-medium hover:bg-ocean/90 transition shadow cursor-pointer"
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={busy}
                            className="px-6 py-2.5 bg-ocean text-white rounded-lg font-semibold hover:bg-ocean/90 transition shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                            {busy ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                                    <span>Registering Society…</span>
                                </>
                            ) : (
                                "Register Society"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
