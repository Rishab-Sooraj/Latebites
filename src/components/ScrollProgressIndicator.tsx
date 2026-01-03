"use client";

import { useEffect, useState, useRef } from "react";
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
    const [isDarkBackground, setIsDarkBackground] = useState(true);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    useEffect(() => {
        const checkBackgroundColor = () => {
            if (!indicatorRef.current) return;

            // Get the position of the indicator
            const rect = indicatorRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Get the element at that position (temporarily hide indicator)
            indicatorRef.current.style.pointerEvents = 'none';
            indicatorRef.current.style.visibility = 'hidden';

            const elementAtPoint = document.elementFromPoint(x, y);

            indicatorRef.current.style.visibility = 'visible';
            indicatorRef.current.style.pointerEvents = 'auto';

            if (elementAtPoint) {
                // Walk up the DOM tree to find background color
                let element: Element | null = elementAtPoint;
                let bgColor = 'rgb(0, 0, 0)';

                while (element && element !== document.body) {
                    const computedStyle = window.getComputedStyle(element);
                    const bg = computedStyle.backgroundColor;

                    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                        bgColor = bg;
                        break;
                    }
                    element = element.parentElement;
                }

                // Parse RGB and calculate luminance
                const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    const r = parseInt(match[1]);
                    const g = parseInt(match[2]);
                    const b = parseInt(match[3]);
                    // Calculate relative luminance
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    setIsDarkBackground(luminance < 0.5);
                }
            }
        };

        const handleScroll = () => {
            setIsVisible(window.scrollY > 100);

            // Find active section
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

            // Check background color
            checkBackgroundColor();
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        // Also check on resize
        window.addEventListener("resize", checkBackgroundColor);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", checkBackgroundColor);
        };
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={indicatorRef}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-6"
                >
                    {/* Progress Line Background */}
                    <div
                        className="relative h-48 w-[1px] transition-colors duration-300"
                        style={{ backgroundColor: isDarkBackground ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    >
                        <motion.div
                            className="absolute top-0 left-0 w-full transition-colors duration-300"
                            style={{
                                height: lineHeight,
                                backgroundColor: isDarkBackground ? '#ffffff' : '#000000'
                            }}
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
                                    className="text-[10px] font-light tracking-widest transition-colors duration-300"
                                    style={{
                                        color: activeSection === index
                                            ? (isDarkBackground ? '#ffffff' : '#000000')
                                            : (isDarkBackground ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')
                                    }}
                                >
                                    {section.number}
                                </span>

                                <motion.div
                                    className="h-[1px] origin-left transition-colors duration-300"
                                    style={{ backgroundColor: isDarkBackground ? '#ffffff' : '#000000' }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: activeSection === index ? 20 : 0,
                                        opacity: activeSection === index ? 1 : 0
                                    }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                />

                                <span
                                    className="absolute left-full ml-4 text-[9px] uppercase tracking-[0.2em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    style={{ color: isDarkBackground ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
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
