"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment, Float, Sparkles, Trail } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Spaceship Model
function Spaceship({ isLaunching }) {
    const group = useRef();
    const engineRef = useRef();

    // Animate ship
    useFrame((state, delta) => {
        if (group.current) {
            // Idle float
            if (!isLaunching) {
                group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
                group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
            } else {
                // Launch sequence
                // Move forward rapidly
                group.current.position.z -= delta * 100; // Speed up
                group.current.rotation.z += delta * 2; // Spin effect

                // Shake effect
                group.current.position.x += (Math.random() - 0.5) * 0.2;
                group.current.position.y += (Math.random() - 0.5) * 0.2;
            }
        }

        // Engine pulse
        if (engineRef.current) {
            const intensity = isLaunching ? 20 : 2 + Math.sin(state.clock.elapsedTime * 10) * 1;
            engineRef.current.intensity = intensity;
        }
    });

    const shipColor = "#00bcd4"; // Cyan theme
    const darkMetal = "#1a1a1a";

    return (
        <group ref={group} rotation={[0, Math.PI, 0]} position={[0, -1, 0]}>
            {/* Main Body */}
            <mesh position={[0, 0, 0]}>
                <coneGeometry args={[1, 4, 32]} />
                <meshStandardMaterial color={darkMetal} metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Cockpit */}
            <mesh position={[0, 0.5, 0.6]}>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Wings */}
            <mesh position={[1.2, -1, 0.5]} rotation={[0, 0, -0.5]}>
                <boxGeometry args={[2, 0.1, 1.5]} />
                <meshStandardMaterial color={shipColor} metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[-1.2, -1, 0.5]} rotation={[0, 0, 0.5]}>
                <boxGeometry args={[2, 0.1, 1.5]} />
                <meshStandardMaterial color={shipColor} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Engines */}
            <group position={[0, -2, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.4, 0.6, 0.5, 32]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Engine Glow */}
                <pointLight ref={engineRef} distance={5} decay={2} color="cyan" />
                <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.3, 0.8, 32, 1, true]} />
                    <meshBasicMaterial color="cyan" transparent opacity={0.8} />
                </mesh>
            </group>

            {/* Trails (Only visible when launching) */}
            {isLaunching && (
                <Trail width={2} length={10} color={'cyan'} attenuation={(t) => t * t}>
                    <mesh position={[1.5, -1, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshBasicMaterial color="cyan" />
                    </mesh>
                    <mesh position={[-1.5, -1, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshBasicMaterial color="cyan" />
                    </mesh>
                </Trail>
            )}
        </group>
    );
}

function WarpSpeed({ isLaunching }) {
    // Modify Stars to look like they are passing by rapidly
    const count = isLaunching ? 2000 : 500;

    // Custom star movement could be added here, but built-in Stars/Sparkles are good for now
    // We can simulate warp by moving the camera or the stars

    return (
        <>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={isLaunching ? 5 : 1} />
            {isLaunching && (
                <Sparkles
                    count={200}
                    scale={12}
                    size={4}
                    speed={20}
                    opacity={0.5}
                    color="white"
                    position={[0, 0, -20]} // In front of ship
                />
            )}
        </>
    );
}

export default function SuccessAnimation() {
    const [isLaunching, setIsLaunching] = useState(false);

    // Trigger launch sequence after a short delay
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLaunching(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-black">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                <WarpSpeed isLaunching={isLaunching} />

                <Float speed={isLaunching ? 20 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Spaceship isLaunching={isLaunching} />
                </Float>

                <Environment preset="city" />
            </Canvas>

            {/* Cinematic Text Overlay */}
            <div className={`absolute top-1/4 left-0 right-0 text-center transition-opacity duration-1000 ${isLaunching ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter">
                    PASSWORD UPDATED
                </h2>
                <p className="text-cyan-500/80 tracking-[0.5em] mt-2 text-sm uppercase">Initiating Warp Drive</p>
            </div>
        </div>
    );
}
