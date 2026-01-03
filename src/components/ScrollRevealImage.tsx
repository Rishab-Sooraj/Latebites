"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
    parallaxIntensity = 0.15,
}: ScrollRevealImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "center center"],
    });

    // Grayscale transitions from 100% to 0% as you scroll the image into view
    const grayscale = useTransform(scrollYProgress, [0, 0.5, 1], [100, 50, 0]);
    const brightness = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 0.8, 1]);
    const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
    const y = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

    // 3D rotation based on scroll
    const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, -2]);

    // Overlay opacity fades out as you scroll
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.5, 0.2, 0]);

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
            {/* Image Container with 3D Transform */}
            <motion.div
                className="absolute inset-0 origin-center"
                style={{
                    scale,
                    rotateX,
                    y,
                }}
            >
                {/* The actual image with scroll-linked grayscale */}
                <motion.div
                    className="relative w-full h-full"
                    style={{
                        filter: useTransform(
                            [grayscale, brightness],
                            ([g, b]) => `grayscale(${g}%) brightness(${b})`
                        ),
                    }}
                >
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </motion.div>

                {/* Dark overlay that fades out */}
                <motion.div
                    className="absolute inset-0 bg-black pointer-events-none"
                    style={{ opacity: overlayOpacity }}
                />

                {/* Reveal shine effect */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
                        opacity: useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]),
                    }}
                />
            </motion.div>

            {/* Border glow effect on reveal */}
            <motion.div
                className="absolute inset-0 pointer-events-none rounded-sm"
                style={{
                    boxShadow: useTransform(
                        scrollYProgress,
                        [0, 0.5, 1],
                        [
                            "inset 0 0 0 0 rgba(255,255,255,0)",
                            "inset 0 0 40px -20px rgba(255,255,255,0.3)",
                            "inset 0 0 0 0 rgba(255,255,255,0)"
                        ]
                    ),
                }}
            />
        </motion.div>
    );
}
