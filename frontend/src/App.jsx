// App component

import { Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import DashOverview from "./pages/DashOverview";
import ReportForm from "./pages/ReportForm";
import DashAlerts from "./pages/DashAlerts";
import DashHistory from "./pages/DashHistory";

export default function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
            </Route>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashOverview />} />
                <Route path="water-reports" element={<ReportForm />} />
                <Route path="analytics" element={<DashOverview analytics />} />
                <Route path="alerts" element={<DashAlerts />} />
                <Route path="history" element={<DashHistory />} />
                {/* society-profile: see "Not included" list */}
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}