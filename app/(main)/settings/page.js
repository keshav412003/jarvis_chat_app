"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Palette, LogOut, ChevronRight, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

export default function SettingsPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                setUser(data.user);
                setLoading(false);
            })
            .catch(() => {
                router.push('/login');
            });
    }, [router]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            addToast({ title: 'Error', description: 'Invalid file type. Only JPEG, PNG and WebP are allowed.', type: 'error' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addToast({ title: 'Error', description: 'File size too large. Max 5MB allowed.', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch('/api/users/me/avatar', {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                addToast({ title: 'Success', description: 'Profile picture updated.', type: 'success' });
            } else {
                addToast({ title: 'Error', description: data.message || 'Failed to update avatar.', type: 'error' });
            }
        } catch (error) {
            addToast({ title: 'Error', description: 'Failed to upload avatar.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                addToast({ title: 'Logged Out', description: 'Successfully logged out.', type: 'success' });
                router.push('/login');
            }
        } catch (error) {
            addToast({ title: 'Error', description: 'Failed to logout.', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { icon: User, label: 'Profile', description: 'Manage your profile information', action: () => { } },
                { icon: Mail, label: 'Email', description: user?.email || 'Not set', action: () => { } },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: Bell, label: 'Notifications', description: 'Manage notification settings', action: () => { } },
                { icon: Palette, label: 'Appearance', description: 'Customize your theme', action: () => { } },
            ]
        },
        {
            title: 'Security',
            items: [
                { icon: Shield, label: 'Privacy', description: 'Control your privacy settings', action: () => { } },
            ]
        }
    ];

    return (
        <div className="h-full w-full flex flex-col bg-black/40 backdrop-blur-sm">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/60 backdrop-blur-md p-6">
                <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400 text-sm">Manage your account and preferences</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* User Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-cyan-900/20 to-black/40 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-cyan-500/50">
                                    {uploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.name?.[0]?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                    <Camera className="w-6 h-6 text-white" />
                                </label>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{user?.name || 'User'}</h2>
                                <p className="text-gray-400 text-sm">{user?.email || 'No email'}</p>
                                <p className="text-cyan-400/80 text-xs mt-1 font-medium">Click to change avatar</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Settings Sections */}
                    {settingsSections.map((section, sectionIdx) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: sectionIdx * 0.1 }}
                            className="space-y-2"
                        >
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">
                                {section.title}
                            </h3>
                            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                                {section.items.map((item, idx) => (
                                    <button
                                        key={item.label}
                                        onClick={item.action}
                                        className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group ${idx !== section.items.length - 1 ? 'border-b border-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                                                <item.icon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-white font-medium">{item.label}</p>
                                                <p className="text-gray-400 text-sm">{item.description}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-500 group-hover:text-cyan-400 transition-colors" size={20} />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ))}

                    {/* Logout Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={handleLogout}
                        className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:bg-red-500/20 transition-colors group flex items-center justify-center gap-3"
                    >
                        <LogOut className="text-red-400 group-hover:text-red-300" size={20} />
                        <span className="text-red-400 group-hover:text-red-300 font-medium">Logout</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
