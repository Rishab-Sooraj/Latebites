"use client";

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

export function ScrollCamera() {
    const scroll = useScroll();
    const { camera } = useThree();

    useFrame(() => {
        // Smooth camera movement based on scroll
        const scrollY = scroll.offset;
        camera.position.z = 5 - scrollY * 2;
        camera.position.y = scrollY * -1;
    });

    return null;
}

interface Rotating3DObjectProps {
    position: [number, number, number];
    scrollSpeed?: number;
}

export function Rotating3DObject({ position, scrollSpeed = 1 }: Rotating3DObjectProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const scroll = useScroll();

    useFrame((state) => {
        if (meshRef.current) {
            const scrollY = scroll.offset;
            meshRef.current.rotation.x = scrollY * Math.PI * 2 * scrollSpeed;
            meshRef.current.rotation.y = scrollY * Math.PI * scrollSpeed;
            meshRef.current.position.y = position[1] + scrollY * -3;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <torusKnotGeometry args={[0.8, 0.3, 100, 16]} />
            <meshStandardMaterial
                color="#4ade80"
                metalness={0.8}
                roughness={0.2}
                transparent
                opacity={0.7}
            />
        </mesh>
    );
}
