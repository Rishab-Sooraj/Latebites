"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingShapeProps {
    position: [number, number, number];
    color: string;
    speed?: number;
}

export function FloatingShape({ position, color, speed = 1 }: FloatingShapeProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
        }
    });

    return (
        <Float
            speed={speed}
            rotationIntensity={0.5}
            floatIntensity={0.5}
            floatingRange={[-0.5, 0.5]}
        >
            <mesh ref={meshRef} position={position}>
                <icosahedronGeometry args={[0.5, 0]} />
                <MeshDistortMaterial
                    color={color}
                    transparent
                    opacity={0.6}
                    distort={0.3}
                    speed={2}
                    roughness={0.4}
                    metalness={0.8}
                />
            </mesh>
        </Float>
    );
}

export function FloatingParticles() {
    return (
        <>
            {/* Ambient light */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4ade80" />

            {/* Floating shapes */}
            <FloatingShape position={[-3, 2, -2]} color="#4ade80" speed={0.8} />
            <FloatingShape position={[3, -1, -3]} color="#22c55e" speed={1.2} />
            <FloatingShape position={[-2, -2, -1]} color="#16a34a" speed={1} />
            <FloatingShape position={[2, 1, -2.5]} color="#15803d" speed={0.9} />
            <FloatingShape position={[0, 0, -4]} color="#166534" speed={1.1} />
        </>
    );
}
