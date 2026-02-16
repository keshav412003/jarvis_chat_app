"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Palette, Loader2 } from 'lucide-react';

export function StatusCreate({ onCreated, onCancel }) {
    const [text, setText] = useState('');
    const [color, setColor] = useState('#0a0a0a'); // Dark theme default
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const colors = [
        '#0a0a0a', '#1a1a1a', '#2d3436', '#0984e3',
        '#6c5ce7', '#d63031', '#e84393', '#00b894'
    ];

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!text || text.length > 300) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, color })
            });

            const data = await res.json();

            if (res.ok) {
                onCreated(data.status);
            } else {
                setError(data.error || 'Failed to initialize update.');
            }
        } catch (err) {
            console.error("Status creation error:", err);
            setError('UpLink interrupted.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div
                className="relative w-full aspect-video rounded-2xl border border-white/10 flex items-center justify-center p-8 transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: color }}
            >
                <textarea
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="What's on your mind, Agent?"
                    className="w-full bg-transparent border-none text-xl md:text-2xl font-bold text-white text-center placeholder-white/20 focus:outline-none focus:ring-0 resize-none min-h-[120px]"
                    maxLength={300}
                />

                <div className="absolute bottom-4 right-6 text-[9px] font-mono text-white/30 tracking-widest uppercase">
                    {text.length} / 300
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center gap-2">
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-cyan-500 scale-110 shadow-[0_0_10px_rgba(0,243,255,0.4)]' : 'border-white/5 hover:border-white/20'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-[10px] text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !text.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-[10px] transition-all ${!text.trim() || loading ? 'bg-white/5 text-gray-700' : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        Execute
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-center font-mono text-[9px] uppercase tracking-widest"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
