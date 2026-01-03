"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface ScrollRevealImageProps {
    src: string;
    alt: string;
    aspectRatio?: "square" | "portrait" | "landscape" | "wide";
    className?: string;
    parallaxIntensity?: number;
}

export function ScrollRevealImage({
    src,
    alt,
    aspectRatio = "portrait",
    className = "",
    parallaxIntensity = 0.1,
}: ScrollRevealImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, {
        once: false,
        margin: "-20% 0px -20% 0px"
    });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    // Parallax effect
    const y = useTransform(scrollYProgress, [0, 1], ["0%", `${parallaxIntensity * 100}%`]);

    // 3D tilt based on scroll
    const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

    const aspectClasses = {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        landscape: "aspect-[4/3]",
        wide: "aspect-[16/9]",
    };

    return (
        <motion.div
            ref={containerRef}
            className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
            style={{
                perspective: "1000px",
                transformStyle: "preserve-3d",
            }}
        >
            <motion.div
                className="absolute inset-0"
                style={{
                    y,
                    rotateX,
                    scale,
                    transformOrigin: "center center",
                }}
            >
                {/* Grayscale to Color Transition */}
                <motion.div
                    className="relative w-full h-full"
                    initial={{ filter: "grayscale(100%) brightness(0.8)" }}
                    animate={{
                        filter: isInView
                            ? "grayscale(0%) brightness(1)"
                            : "grayscale(100%) brightness(0.8)"
                    }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </motion.div>

                {/* Subtle Overlay that fades */}
                <motion.div
                    className="absolute inset-0 bg-black/30"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: isInView ? 0 : 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Reveal Line Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"
                    initial={{ y: "-100%" }}
                    animate={{ y: isInView ? "200%" : "-100%" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                />
            </motion.div>

            {/* Border glow on reveal */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{
                    boxShadow: "inset 0 0 0 0 rgba(255,255,255,0)"
                }}
                animate={{
                    boxShadow: isInView
                        ? "inset 0 0 60px -30px rgba(255,255,255,0.3)"
                        : "inset 0 0 0 0 rgba(255,255,255,0)"
                }}
                transition={{ duration: 1, delay: 0.5 }}
            />
        </motion.div>
    );
}
