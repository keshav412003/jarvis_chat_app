"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';

export default function LandingHero() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl space-y-8"
        >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-wider mb-4">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                SECURE COMMUNICATION UPLINK
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                The Future of <br />
                Secure Messaging
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                End-to-end encrypted, lightning fast, and designed for operatives who demand privacy.
                Welcome to the next generation of digital communication.
            </p>
        </motion.div>
    );
}
