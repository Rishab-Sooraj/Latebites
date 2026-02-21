"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";

/* Lazy-load particles — not critical for initial paint */
const FloatingParticles = dynamic(
    () => import("@/components/FloatingParticles"),
    { ssr: false }
);

const BODY_PARAGRAPHS = [
    "We connect people with nearby restaurants offering extra freshly prepared meals at lower prices.",
    "Not leftovers. Not old food. Just good food that simply didn't get sold in time.",
    "We maintain strict quality standards, monitor reliability, and work closely with every partner.",
    "Because when you trust us with your meal, we take that seriously.",
    "That's it. Simple, safe, and taken care of.",
];

const BODY_TEXT = BODY_PARAGRAPHS.join(" ");
const bodyWords = BODY_TEXT.split(" ");

/* ── Individual word that scroll-reveals ── */
function ScrollWord({
    word,
    index,
    totalWords,
    scrollYProgress,
}: {
    word: string;
    index: number;
    totalWords: number;
    scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
    const prefersReduced = useReducedMotion();

    // Section is 250vh tall; content is sticky in the middle 150vh chunk.
    // scrollYProgress 0→1 maps across the full 250vh scroll range.
    // We want words to reveal between 20% and 80% of that range.
    const start = 0.2 + (index / totalWords) * 0.52;
    const end = start + 0.04;

    const opacity = useTransform(scrollYProgress, [start, end], [0.18, 1]);
    const color = useTransform(
        scrollYProgress,
        [start, end],
        ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.92)"]
    );

    if (prefersReduced) {
        return <span className="text-white/90">{word}&nbsp;</span>;
    }

    return (
        <motion.span
            style={{ opacity, color, display: "inline-block", willChange: "opacity" }}
            className="transition-none"
        >
            {word}&nbsp;
        </motion.span>
    );
}

/* ── Hand-drawn underline ── */
function HandUnderline() {
    return (
        <motion.svg
            viewBox="0 0 420 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[480px] mx-auto mt-3"
            aria-hidden="true"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        >
            <motion.path
                d="M4 11 C55 4, 120 15, 185 9 C250 3, 315 15, 375 10 C395 8, 410 12, 416 10"
                stroke="white"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.65}
            />
            <motion.path
                d="M10 15 C75 11, 155 17, 225 13 C295 9, 365 16, 412 13"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
                opacity={0.3}
            />
        </motion.svg>
    );
}

/* ── Main section ── */
export function OurAimSection() {
    const containerRef = useRef<HTMLElement>(null);

    // Use a tall section so there's plenty of scroll room for the word reveal
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    return (
        /*
          250vh tall so the scroll-reveal has room to breathe.
          The content div is sticky so it stays centered on screen
          while the user scrolls through the section.
        */
        <section
            ref={containerRef}
            id="our-aim"
            className="relative"
            style={{ height: "260vh" }}
        >
            {/* Sticky wrapper — stays in view as you scroll through 260vh */}
            <div className="sticky top-0 h-screen overflow-hidden">

                {/* Particles fill the sticky container */}
                <div className="absolute inset-0 z-0">
                    <FloatingParticles
                        particleCount={50}
                        particleSize={2.5}
                        particleOpacity={0.6}
                        glowIntensity={10}
                        movementSpeed={0.8}
                        mouseInfluence={150}
                        backgroundColor="#000000"
                        particleColor="#FFFFFF"
                        mouseGravity="repel"
                        gravityStrength={80}
                    />
                </div>

                {/* Content — pointer-events-none so mouse reaches particles */}
                <div className="relative z-[1] h-full flex items-center justify-center px-5 sm:px-8 py-16 pointer-events-none">
                    <div className="max-w-2xl mx-auto text-center space-y-10">

                        {/* Headline */}
                        <div>
                            <motion.h2
                                className="text-4xl sm:text-5xl md:text-6xl font-serif font-semibold text-white leading-[1.15] tracking-tight"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            >
                                Fresh food only.{" "}
                                <span className="italic">No compromises.</span>
                            </motion.h2>
                            <HandUnderline />
                        </div>

                        {/* Scroll-reveal body */}
                        <p className="text-lg sm:text-xl md:text-2xl font-serif leading-[1.7] tracking-[-0.01em]">
                            {bodyWords.map((word, i) => (
                                <ScrollWord
                                    key={i}
                                    word={word}
                                    index={i}
                                    totalWords={bodyWords.length}
                                    scrollYProgress={scrollYProgress}
                                />
                            ))}
                        </p>

                    </div>
                </div>
            </div>
        </section>
    );
}
