"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

interface Scene3DProps {
    children: React.ReactNode;
    className?: string;
    cameraPosition?: [number, number, number];
    enableControls?: boolean;
}

export function Scene3D({
    children,
    className = "",
    cameraPosition = [0, 0, 5],
    enableControls = false
}: Scene3DProps) {
    return (
        <div className={`absolute inset-0 ${className}`} style={{ pointerEvents: enableControls ? 'auto' : 'none' }}>
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance"
                }}
                dpr={[1, 2]}
            >
                <PerspectiveCamera makeDefault position={cameraPosition} />
                {enableControls && <OrbitControls enableZoom={false} enablePan={false} />}
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </Canvas>
        </div>
    );
}
