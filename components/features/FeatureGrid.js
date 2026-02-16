"use client";

import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';

const features = [
    { icon: Shield, title: "Military-Grade Encryption", desc: "Your messages are encrypted before they leave your device." },
    { icon: Zap, title: "Zero Latency", desc: "Real-time communication infrastructure powered by Socket.IO." },
    { icon: Globe, title: "Global Network", desc: "Connect with operatives worldwide through our distributed nodes." }
];

export default function FeatureGrid() {
    return (
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
            {features.map((feature, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group"
                >
                    <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon size={24} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
            ))}
        </div>
    );
}
