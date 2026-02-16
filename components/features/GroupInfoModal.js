"use client";

import { Button } from '@/components/ui/Button';
import { X, Users, Key, Check, Copy, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useToast } from '@/components/providers/ToastProvider';

export function GroupInfoModal({ chatDetails, onClose, isGroupAdmin, onLeaveGroup, onDeleteGroup, onAvatarUpdate }) {
    const [copied, setCopied] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();

    const copyCode = useCallback(() => {
        if (chatDetails?.groupCode) {
            navigator.clipboard.writeText(chatDetails.groupCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [chatDetails?.groupCode]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            addToast({ title: 'Error', description: 'Invalid file type.', type: 'error' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            addToast({ title: 'Error', description: 'File size too large (max 5MB).', type: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch(`/api/chats/${chatDetails._id}/avatar`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                onAvatarUpdate?.(data.chat.groupAvatar);
                addToast({ title: 'Success', description: 'Group avatar updated.', type: 'success' });
            } else {
                addToast({ title: 'Error', description: data.message || 'Failed to update avatar.', type: 'error' });
            }
        } catch (error) {
            addToast({ title: 'Error', description: 'Failed to upload avatar.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    if (!chatDetails) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 border border-cyan-500/30 w-full max-w-md rounded-2xl relative shadow-[0_0_30px_rgba(0,243,255,0.2)] overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <Users size={20} /> Protocol Details
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-scrollbar-hidden">

                    {/* Group Identity */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-cyan-900/30 border-2 border-cyan-500/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,243,255,0.3)] group">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            ) : chatDetails.groupAvatar ? (
                                <img src={chatDetails.groupAvatar} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold text-cyan-400">{chatDetails.groupName?.[0]}</span>
                            )}

                            {isGroupAdmin && !uploading && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleAvatarUpload}
                                    />
                                    <Camera className="w-6 h-6 text-white" />
                                </label>
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white tracking-wide">{chatDetails.groupName}</h3>
                            <p className="text-sm text-cyan-500/80 font-mono mt-1">
                                {chatDetails.participants?.length || 0} Operatives Active
                            </p>
                        </div>
                    </div>

                    {/* Admin: Access Key */}
                    {isGroupAdmin && (
                        <div className="bg-black/60 p-4 rounded-xl border border-white/10 group hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={copyCode}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-cyan-500 font-bold tracking-widest">ACCESS KEY</span>
                                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-500 group-hover:text-cyan-400" />}
                            </div>
                            <div className="text-lg font-mono text-white tracking-[0.2em] text-center select-all bg-white/5 py-2 rounded">
                                {chatDetails.groupCode}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 text-center">Tap to copy encrypted key</p>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-[10px] text-gray-500 block mb-1">DEPLOYED</span>
                            <span className="text-sm text-gray-300 font-mono">
                                {chatDetails.createdAt ? new Date(chatDetails.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-[10px] text-gray-500 block mb-1">COMMANDER</span>
                            <span className="text-sm text-cyan-400 font-bold truncate">
                                {chatDetails.admins?.[0]?.name || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Operatives List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Users size={12} /> Operatives Roster
                        </h4>
                        <div className="space-y-2 bg-black/40 rounded-xl p-2 border border-white/5">
                            {isGroupAdmin ? (
                                chatDetails.participants?.map(p => (
                                    <div key={p._id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group/item">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 relative border border-white/10">
                                            {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-full object-cover" /> : p.name[0]}
                                            {p.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-200 truncate group-hover/item:text-white transition-colors">{p.name}</p>
                                                {chatDetails.admins?.some(a => (typeof a === 'string' ? a : a._id) === p._id) && (
                                                    <Key size={12} className="text-cyan-500" title="Admin Level Access" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center border border-white/5 rounded bg-white/5">
                                    <p className="text-xs text-gray-500 font-mono">CLASSIFIED INFORMATION</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-black/40 space-y-3">
                    {/* Delete Group (Admin Only) */}
                    {isGroupAdmin && (
                        <Button
                            onClick={onDeleteGroup}
                            variant="ghost"
                            className="w-full flex items-center justify-center gap-2 h-10 
                       bg-red-600/20 hover:bg-red-600/30
                       text-red-500 hover:text-red-400
                       border border-red-600/30
                       rounded-lg transition-all duration-200"
                        >
                            <span className="font-semibold">Delete Group</span>
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
