// WaterScroll component

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

const WAVE = "M0 30 Q180 0 360 30 T720 30 T1080 30 T1440 30 T1800 30 T2160 30 T2520 30 T2880 30 V60 H0 Z";

export default function WaterScroll() {
    const { scrollYProgress } = useScroll();
    const reduce = useReducedMotion();
    const top = useTransform(scrollYProgress, [0, 1], ["88%", "45%"]);

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <motion.div style={{ top: reduce ? "70%" : top }} className="absolute inset-x-0 bottom-0">
                <div className="overflow-hidden h-10">
                    <svg className="wave-track h-10" viewBox="0 0 2880 60" preserveAspectRatio="none">
                        <path d={WAVE} fill="#5fd3c9" fillOpacity="0.35" />
                    </svg>
                </div>
                <div className="h-full bg-gradient-to-b from-turq/35 to-ocean/25" />
            </motion.div>
        </div>
    );
}