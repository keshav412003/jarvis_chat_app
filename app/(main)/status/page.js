"use client";

import { motion } from 'framer-motion';

export default function StatusPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-full shadow-[0_0_50px_rgba(0,243,255,0.1)] relative"
            >
                <div className="w-32 h-32 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-300 tracking-widest uppercase">Select an Update</h2>
            <p className="text-gray-500 max-w-md font-mono text-sm uppercase">
                Choose a broadcast from the left to view mission updates.
            </p>
        </div>
    );
}
