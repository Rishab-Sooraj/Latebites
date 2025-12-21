"use client";

import { motion } from "motion/react";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="fixed top-0 left-0 w-full z-50 px-6 py-8 md:px-12 md:py-12 flex justify-between items-center pointer-events-none"
    >
      <div className="font-serif italic text-2xl tracking-tighter pointer-events-auto cursor-default">
        Latebites
      </div>
      <div className="flex gap-8 text-[10px] uppercase tracking-[0.3em] text-muted-foreground pointer-events-auto">
        <a href="#" className="hover:text-primary transition-colors">Vision</a>
        <a href="#" className="hover:text-primary transition-colors">Manifesto</a>
      </div>
    </motion.header>
  );
}
