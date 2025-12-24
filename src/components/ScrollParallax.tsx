"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

interface ScrollParallaxImageProps {
    src: string;
    alt: string;
    className?: string;
    speed?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollParallaxImage({
    src,
    alt,
    className = "",
    speed = 0.5,
    direction = 'up'
}: ScrollParallaxImageProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const getTransform = () => {
        const range = 200 * speed;
        switch (direction) {
            case 'up':
                return useTransform(scrollYProgress, [0, 1], [range, -range]);
            case 'down':
                return useTransform(scrollYProgress, [0, 1], [-range, range]);
            case 'left':
                return useTransform(scrollYProgress, [0, 1], [range, -range]);
            case 'right':
                return useTransform(scrollYProgress, [0, 1], [-range, range]);
        }
    };

    const y = direction === 'up' || direction === 'down' ? getTransform() : 0;
    const x = direction === 'left' || direction === 'right' ? getTransform() : 0;

    return (
        <div ref={ref} className={`absolute ${className}`}>
            <motion.div
                style={{ y, x }}
                className="relative w-full h-full"
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    priority={false}
                />
            </motion.div>
        </div>
    );
}

export function ScrollFloatingElements() {
    const { scrollYProgress } = useScroll();

    const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 0.6, 0.6, 0.3]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Floating emoji/icons that move on scroll */}
            <motion.div
                style={{ rotate, scale, opacity }}
                className="absolute top-1/4 left-1/4 text-6xl"
            >
                🥗
            </motion.div>
            <motion.div
                style={{
                    rotate: useTransform(scrollYProgress, [0, 1], [0, -360]),
                    scale,
                    opacity
                }}
                className="absolute top-1/3 right-1/4 text-6xl"
            >
                🍕
            </motion.div>
            <motion.div
                style={{
                    rotate: useTransform(scrollYProgress, [0, 1], [360, 0]),
                    scale,
                    opacity
                }}
                className="absolute bottom-1/3 left-1/3 text-6xl"
            >
                🍜
            </motion.div>
            <motion.div
                style={{ rotate, scale, opacity }}
                className="absolute bottom-1/4 right-1/3 text-6xl"
            >
                🥘
            </motion.div>
        </div>
    );
}
