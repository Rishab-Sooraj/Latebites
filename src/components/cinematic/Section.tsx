"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.2 }}
      className={cn(
        "min-h-screen flex flex-col items-center justify-center px-6 md:px-24 py-24 md:py-48",
        className
      )}
    >
      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
}
