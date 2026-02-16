"use client";

import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles, PerspectiveCamera } from '@react-three/drei';

export default function InteractiveBackground() {
    return (
        <div className="fixed inset-0 z-[-1] bg-black">
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

                {/* Lights */}
                <ambientLight intensity={0.2} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.5}
                    penumbra={1}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#00ffff" />

                {/* Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={100} scale={12} size={4} speed={0.4} opacity={0.5} color="#4fc3f7" />
            </Canvas>
            {/* Subtlety Overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05),_transparent_60%)] pointer-events-none" />
        </div>
    );
}
