"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

interface Section {
    id: string;
    label: string;
    number: string;
    isDark: boolean; // Whether the section has a dark background
}

const sections: Section[] = [
    { id: "hero", label: "Welcome", number: "01", isDark: true },
    { id: "problem", label: "The Problem", number: "02", isDark: false },
    { id: "belief", label: "Our Belief", number: "03", isDark: false },
    { id: "what-we-do", label: "What We Do", number: "04", isDark: true },
    { id: "impact", label: "Our Impact", number: "05", isDark: false },
    { id: "vision", label: "The Vision", number: "06", isDark: false },
    { id: "onboard", label: "Join Us", number: "07", isDark: false },
];

export function ScrollProgressIndicator() {
    const [activeSection, setActiveSection] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isDarkBackground, setIsDarkBackground] = useState(true);
    const { scrollYProgress } = useScroll();

    // Transform scroll progress to line height
    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            // Show indicator after hero section starts
            setIsVisible(window.scrollY > 100);

            // Find active section and its background
            sections.forEach((section, index) => {
                const element = document.getElementById(section.id);
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect();
                    const sectionMiddle = top + (bottom - top) / 2;

                    if (sectionMiddle < window.innerHeight / 2 && sectionMiddle > -window.innerHeight / 2) {
                        setActiveSection(index);
                        setIsDarkBackground(section.isDark);
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Dynamic colors based on background
    const textColor = isDarkBackground ? "text-white" : "text-black";
    const textColorMuted = isDarkBackground ? "text-white/30" : "text-black/30";
    const textColorHover = isDarkBackground ? "group-hover:text-white/60" : "group-hover:text-black/60";
    const lineColor = isDarkBackground ? "bg-white" : "bg-black";
    const lineColorMuted = isDarkBackground ? "bg-white/10" : "bg-black/10";

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6"
                >
                    {/* Progress Line Background */}
                    <div className={`relative h-48 w-[1px] ${lineColorMuted} transition-colors duration-500`}>
                        {/* Animated Progress */}
                        <motion.div
                            className={`absolute top-0 left-0 w-full ${lineColor} transition-colors duration-500`}
                            style={{ height: lineHeight }}
                        />
                    </div>

                    {/* Section Numbers */}
                    <div className="flex flex-col gap-4">
                        {sections.map((section, index) => (
                            <motion.button
                                key={section.id}
                                onClick={() => {
                                    document.getElementById(section.id)?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    });
                                }}
                                className="group relative flex items-center gap-3"
                                whileHover={{ x: 5 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Number */}
                                <motion.span
                                    className={`text-[10px] font-light tracking-widest transition-all duration-500 ${activeSection === index
                                            ? textColor
                                            : `${textColorMuted} ${textColorHover}`
                                        }`}
                                >
                                    {section.number}
                                </motion.span>

                                {/* Active Indicator Line */}
                                <motion.div
                                    className={`h-[1px] ${lineColor} origin-left transition-colors duration-500`}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: activeSection === index ? 20 : 0,
                                        opacity: activeSection === index ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                />

                                {/* Label (shows on hover) */}
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    whileHover={{ opacity: 1, x: 0 }}
                                    className={`absolute left-full ml-4 text-[9px] uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-500 ${isDarkBackground ? "text-white/60" : "text-black/60"
                                        }`}
                                >
                                    {section.label}
                                </motion.span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
