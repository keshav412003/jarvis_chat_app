"use client";

import { motion } from 'framer-motion';

export default function Home() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-full shadow-[0_0_50px_rgba(0,243,255,0.1)] relative group"
            >
                <img src="/jarvis_logo.png" alt="System" className="w-32 h-32 opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => e.target.style.display = 'none'} />
                <div className="absolute inset-0 rounded-full border border-cyan-500/10" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-300 tracking-widest">SYSTEM READY</h2>
            <p className="text-gray-500 max-w-md font-mono text-sm">
                Select a secure channel from the sidebar to begin transmission.
            </p>
        </div>
    );
}
