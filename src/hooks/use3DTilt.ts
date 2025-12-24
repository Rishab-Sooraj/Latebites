import { useState, MouseEvent } from 'react';

interface TiltConfig {
    maxTilt?: number;
    perspective?: number;
    scale?: number;
}

export function use3DTilt(config: TiltConfig = {}) {
    const { maxTilt = 15, perspective = 1000, scale = 1.05 } = config;

    const [transform, setTransform] = useState({
        rotateX: 0,
        rotateY: 0,
        scale: 1,
    });

    const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientY - rect.top) / rect.height;
        const y = (e.clientX - rect.left) / rect.width;

        const rotateX = (x - 0.5) * maxTilt;
        const rotateY = (y - 0.5) * -maxTilt;

        setTransform({
            rotateX,
            rotateY,
            scale,
        });
    };

    const handleMouseLeave = () => {
        setTransform({
            rotateX: 0,
            rotateY: 0,
            scale: 1,
        });
    };

    const tiltStyle = {
        transform: `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transition: 'transform 0.3s ease-out',
    };

    return {
        tiltStyle,
        handleMouseMove,
        handleMouseLeave,
    };
}
