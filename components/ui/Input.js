"use client";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
    return (
        <div className="relative group">
            <input
                className={cn(
                    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm",
                    className
                )}
                {...props}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300" />
        </div>
    );
}
