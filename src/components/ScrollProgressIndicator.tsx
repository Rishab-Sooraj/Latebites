"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

interface Section {
    id: string;
    label: string;
    number: string;
}

const sections: Section[] = [
    { id: "hero", label: "Welcome", number: "01" },
    { id: "problem", label: "The Problem", number: "02" },
    { id: "belief", label: "Our Belief", number: "03" },
    { id: "what-we-do", label: "What We Do", number: "04" },
    { id: "impact", label: "Our Impact", number: "05" },
    { id: "vision", label: "The Vision", number: "06" },
    { id: "onboard", label: "Join Us", number: "07" },
];

export function ScrollProgressIndicator() {
    const [activeSection, setActiveSection] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
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
                    }
                }
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6"
                    style={{ mixBlendMode: 'difference' }}
                >
                    {/* Progress Line Background */}
                    <div className="relative h-48 w-[1px] bg-white/20">
                        <motion.div
                            className="absolute top-0 left-0 w-full bg-white"
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
                                <span
                                    className={`text-[10px] font-light tracking-widest transition-opacity duration-200 ${activeSection === index ? 'text-white' : 'text-white/40'
                                        }`}
                                >
                                    {section.number}
                                </span>

                                <motion.div
                                    className="h-[1px] bg-white origin-left"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: activeSection === index ? 20 : 0,
                                        opacity: activeSection === index ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                />

                                <span
                                    className="absolute left-full ml-4 text-[9px] uppercase tracking-[0.2em] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300"
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
