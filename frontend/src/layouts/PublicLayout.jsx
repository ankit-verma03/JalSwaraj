// Public layout

import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WaterScroll from "../components/WaterScroll";

export default function PublicLayout() {
    return (
        <>
            <WaterScroll />
            <Navbar />
            <main className="min-h-[70vh]"><Outlet /></main>
            <Footer />
        </>
    );
}