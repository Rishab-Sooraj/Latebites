"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide";
}

export function ParallaxImage({
  src,
  alt,
  className,
  aspectRatio = "video",
}: ParallaxImageProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const ratios = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden w-full",
        ratios[aspectRatio],
        className
      )}
    >
      <motion.div style={{ y }} className="absolute inset-[-20%] w-[140%] h-[140%]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 80vw"
        />
      </motion.div>
    </div>
  );
}
