"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Button({ children, className, variant = "primary", ...props }) {
    const variants = {
        primary: "bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]",
        secondary: "bg-red-600/10 border border-red-600/50 text-red-500 hover:bg-red-600/20 hover:shadow-[0_0_20px_rgba(236,29,36,0.4)]",
        ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "px-6 py-3 rounded-xl font-semibold tracking-wide transition-all duration-300 relative overflow-hidden group backdrop-blur-md",
                variants[variant],
                className
            )}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            {/* Scanline effect for primary */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent translate-x-[-100%] group-hover:animate-scanline" />
            )}
        </motion.button>
    );
}
