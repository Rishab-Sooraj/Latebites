"use client";

import { motion, useScroll, useTransform } from 'framer-motion';

export function ScrollBackground() {
    const { scrollYProgress } = useScroll();

    // Transform scroll progress to height - expands as you scroll
    const backgroundHeight = useTransform(scrollYProgress, [0, 0.8], ['100vh', '100%']);

    return (
        <motion.div
            style={{
                height: backgroundHeight,
            }}
            className="fixed top-0 left-0 right-0 w-full bg-gradient-to-br from-cyan-100 via-blue-100 to-teal-100 pointer-events-none z-0"
        />
    );
}
