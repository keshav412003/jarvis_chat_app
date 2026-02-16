"use client";

import { motion } from 'framer-motion';

export function LogoutModal({ onClose, onConfirm }) {
    console.log("LogoutModal: Rendering");
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Click outside to close (Optional, matching GroupModals behavior which doesn't seem to have explicit outside click handler but has backdrop) */}
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-2">Confirm Termination</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Are you sure you want to disconnect from the secure channel?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
