"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/* ── Floating Particles Background ──
   Canvas 2D particle system with mouse gravity.
   Key perf optimisations:
   • IntersectionObserver pauses rAF when offscreen
   • No per-frame allocations
   • Mouse tracked on window (works even behind overlays)
   ──────────────────────────────────────────────────────── */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    baseOpacity: number;
    mass: number;
    glowMultiplier: number;
}

interface FloatingParticlesProps {
    particleCount?: number;
    particleSize?: number;
    particleOpacity?: number;
    glowIntensity?: number;
    movementSpeed?: number;
    mouseInfluence?: number;
    backgroundColor?: string;
    particleColor?: string;
    mouseGravity?: "none" | "attract" | "repel";
    gravityStrength?: number;
    className?: string;
}

export default function FloatingParticles({
    particleCount = 50,
    particleSize = 2.5,
    particleOpacity = 0.6,
    glowIntensity = 10,
    movementSpeed = 0.8,
    mouseInfluence = 150,
    backgroundColor = "#000000",
    particleColor = "#FFFFFF",
    mouseGravity = "repel",
    gravityStrength = 80,
    className = "",
}: FloatingParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Particle[]>([]);
    const isVisibleRef = useRef(false);
    const [ready, setReady] = useState(false);

    /* ── Initialise particles ── */
    const initParticles = useCallback(
        (w: number, h: number) => {
            const p: Particle[] = [];
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = (Math.random() * 0.5 + 0.5) * movementSpeed;
                p.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * particleSize + 0.8,
                    opacity: particleOpacity,
                    baseOpacity: particleOpacity,
                    mass: Math.random() * 0.5 + 0.5,
                    glowMultiplier: 1,
                });
            }
            return p;
        },
        [particleCount, particleSize, particleOpacity, movementSpeed]
    );

    /* ── Resize handler ── */
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const resize = () => {
            const { width, height } = container.getBoundingClientRect();
            if (width === 0 || height === 0) return;
            canvas.width = width;
            canvas.height = height;

            if (particlesRef.current.length === 0) {
                particlesRef.current = initParticles(width, height);
            } else {
                particlesRef.current.forEach((p) => {
                    p.x = Math.random() * width;
                    p.y = Math.random() * height;
                });
            }
            setReady(true);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        return () => ro.disconnect();
    }, [initParticles]);

    /* ── Visibility observer — pause when offscreen ── */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const io = new IntersectionObserver(
            ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
            { threshold: 0 }
        );
        io.observe(container);
        return () => io.disconnect();
    }, []);

    /* ── Mouse tracking on WINDOW (works even behind overlay divs) ── */
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        };

        window.addEventListener("mousemove", handleMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    /* ── Animation loop ── */
    useEffect(() => {
        if (!ready) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const tick = () => {
            animationRef.current = requestAnimationFrame(tick);
            if (!isVisibleRef.current) return;

            const w = canvas.width;
            const h = canvas.height;
            const mouse = mouseRef.current;

            ctx.clearRect(0, 0, w, h);

            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // ── Mouse gravity ──
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouseInfluence && dist > 0) {
                    const force =
                        ((mouseInfluence - dist) / mouseInfluence) *
                        gravityStrength * 0.001;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (mouseGravity === "attract") {
                        p.vx += nx * force;
                        p.vy += ny * force;
                    } else if (mouseGravity === "repel") {
                        p.vx -= nx * force * 1.5;
                        p.vy -= ny * force * 1.5;
                    }

                    // Brighten near cursor
                    const proximity = (mouseInfluence - dist) / mouseInfluence;
                    p.opacity = Math.min(1, p.baseOpacity + proximity * 0.5);
                    p.glowMultiplier += (1 + proximity * 2.5 - p.glowMultiplier) * 0.15;
                } else {
                    p.opacity += (p.baseOpacity - p.opacity) * 0.02;
                    p.glowMultiplier += (1 - p.glowMultiplier) * 0.08;
                }

                // ── Move ──
                p.x += p.vx;
                p.y += p.vy;

                // Subtle random drift to keep them alive
                p.vx += (Math.random() - 0.5) * 0.02;
                p.vy += (Math.random() - 0.5) * 0.02;

                // Damping (slight friction)
                p.vx *= 0.995;
                p.vy *= 0.995;

                // Wrap edges
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;

                // ── Draw ──
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.shadowColor = particleColor;
                ctx.shadowBlur = glowIntensity * p.glowMultiplier * 2;
                ctx.fillStyle = particleColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        animationRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationRef.current);
    }, [
        ready,
        mouseInfluence,
        mouseGravity,
        gravityStrength,
        particleColor,
        glowIntensity,
    ]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    );
}
