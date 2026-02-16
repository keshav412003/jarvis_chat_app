"use client";

import { motion } from 'framer-motion';

export default function PeoplePage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-cyan-500/5 border border-cyan-500/20 p-8 rounded-full shadow-[0_0_50px_rgba(0,243,255,0.1)]"
            >
                <div className="w-32 h-32 flex items-center justify-center opacity-50">
                    <svg className="w-16 h-16 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-300 tracking-widest uppercase">Global Directory</h2>
            <p className="text-gray-500 max-w-md font-mono text-sm uppercase">
                Search for active agents in the grid on the left.
            </p>
        </div>
    );
}
