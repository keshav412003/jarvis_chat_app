"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { useToast } from '@/components/providers/ToastProvider';

export function ProfileSettings({ user }) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        about: user?.about || '',
        avatar: user?.avatar || ''
    });
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        // TODO: Implement API Endpoint for profile update
        // Mocking for now to avoid breaking without backend route
        setTimeout(() => {
            addToast({ title: 'Success', description: 'Profile updated successfully.', type: 'success' });
            setLoading(false);
        }, 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 mt-10"
        >
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center tracking-widest border-b border-cyan-500/20 pb-4">
                AGENT PROFILE
            </h2>

            <div className="flex justify-center mb-6 relative">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500 flex items-center justify-center bg-gray-900 overflow-hidden relative group">
                    <img src={formData.avatar || "https://github.com/shadcn.png"} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-xs text-cyan-400">UPLOAD</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase">Codename</label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase">About / Status</label>
                    <Input
                        value={formData.about}
                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-400 uppercase">Avatar URL</label>
                    <Input
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://..."
                    />
                </div>

                <Button type="submit" variant="primary" className="w-full mt-4 flex justify-center items-center gap-2" disabled={loading}>
                    {loading ? <><Spinner size="sm" /> UPDATING DATA...</> : 'SAVE CHANGES'}
                </Button>
            </form>
        </motion.div>
    );
}
