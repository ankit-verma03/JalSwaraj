// API service

import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    withCredentials: true, // sends the httpOnly cookie
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        const url = err.config?.url || "";
        if (err.response?.status === 401 && !url.includes("/auth/")) {
            window.dispatchEvent(new Event("auth:expired"));
        }
        return Promise.reject(err);
    }
);

export const errorMessage = (err) => {
    if (!err.response) return "Cannot reach the server. Please check that the backend is running.";
    const d = err.response.data?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((e) => e.msg).join("; ");
    return "Something went wrong.";
};

export default api;