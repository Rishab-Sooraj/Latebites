"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

interface Section {
    id: string;
    label: string;
    number: string;
}

// ALL sections in order
const sections: Section[] = [
    { id: "hero", label: "Welcome", number: "01" },
    { id: "problem", label: "The Problem", number: "02" },
    { id: "belief", label: "Our Belief", number: "03" },
    { id: "what-we-do", label: "What We Do", number: "04" },
    { id: "impact", label: "Our Impact", number: "05" },
    { id: "vision", label: "The Vision", number: "06" },
    { id: "how-we-work", label: "How We Work", number: "07" },
    { id: "vetting", label: "Vetting", number: "08" },
    { id: "onboard", label: "Join Us", number: "09" },
    { id: "closing", label: "Closing", number: "10" },
];

// Sections with DARK backgrounds where we need WHITE text
const darkSections = ["hero", "what-we-do", "vetting", "closing"];

export function ScrollProgressIndicator() {
    const [activeSection, setActiveSection] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [useDarkText, setUseDarkText] = useState(false); // false = white, true = black
    const { scrollYProgress } = useScroll();

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 100);

            sections.forEach((section, index) => {
                const element = document.getElementById(section.id);
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect();
                    const sectionMiddle = top + (bottom - top) / 2;

                    if (sectionMiddle < window.innerHeight / 2 && sectionMiddle > -window.innerHeight / 2) {
                        setActiveSection(index);
                        // Check if this section is dark (needs white text) or light (needs black text)
                        setUseDarkText(!darkSections.includes(section.id));
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Colors based on background
    const primaryColor = useDarkText ? "#000000" : "#ffffff";
    const mutedColor = useDarkText ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)";
    const lineBackground = useDarkText ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)";

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
                    <div
                        className="relative h-48 w-[2px] rounded-full transition-colors duration-300"
                        style={{ backgroundColor: lineBackground }}
                    >
                        <motion.div
                            className="absolute top-0 left-0 w-full rounded-full transition-colors duration-300"
                            style={{
                                height: lineHeight,
                                backgroundColor: primaryColor
                            }}
                        />
                    </div>

                    {/* Section Numbers */}
                    <div className="flex flex-col gap-3">
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
                                <span
                                    className="text-[10px] font-medium tracking-widest transition-colors duration-300"
                                    style={{
                                        color: activeSection === index ? primaryColor : mutedColor
                                    }}
                                >
                                    {section.number}
                                </span>

                                <motion.div
                                    className="h-[2px] origin-left rounded-full transition-colors duration-300"
                                    style={{ backgroundColor: primaryColor }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: activeSection === index ? 16 : 0,
                                        opacity: activeSection === index ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                />

                                <span
                                    className="absolute left-full ml-4 text-[9px] uppercase tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 font-medium"
                                    style={{ color: mutedColor }}
                                >
                                    {section.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
