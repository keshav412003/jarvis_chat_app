"use client";


import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { X, Users, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// merged useEffect import
import { useEffect, useState } from 'react';

export function CreateGroupModal({ onClose, onCreated, user }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [groupCode, setGroupCode] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        const fetchSecureChannels = async () => {
            try {
                const res = await fetch('/api/chats');
                const data = await res.json();
                if (data.chats) {
                    // Extract unique participants from direct chats (Secure Channels)
                    const secureUsersMap = new Map();
                    data.chats.forEach(chat => {
                        if (!chat.isGroup) {
                            chat.participants.forEach(p => {
                                if (p._id !== user?.id && p._id !== user?._id) {
                                    secureUsersMap.set(p._id, p);
                                }
                            });
                        }
                    });
                    setUsers(Array.from(secureUsersMap.values()));
                }
            } catch (error) {
                console.error("Failed to fetch secure channels", error);
            } finally {
                setUserLoading(false);
            }
        };
        if (user) fetchSecureChannels();
    }, [user]);

    const toggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupName: name,
                    groupAvatar: '/default-group.png',
                    participants: selectedUsers
                }),
            });
            const data = await res.json();
            if (res.ok && data.group) {
                setGroupCode(data.group.groupCode);
                if (onCreated) onCreated();
            } else {
                setError(data.error || 'Failed to create group');
            }
        } catch (error) {
            console.error(error);
            setError('System Protocol Failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-cyan-500/30 p-6 rounded-2xl w-96 relative shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <Users size={24} /> Initialize Group
                </h2>

                {!groupCode ? (
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && <div className="text-red-500 text-xs mb-2 text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">DESIGNATION (NAME)</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alpha Squad" className="bg-black/50 border-white/10 text-white" />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs text-gray-400 mb-1">SELECT OPERATIVES ({selectedUsers.length})</label>
                            <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2 space-y-1 bg-black/30">
                                {userLoading ? <div className="text-center p-2"><Spinner size="sm" /></div> : (
                                    users.map(u => (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleUser(u._id)}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedUsers.includes(u._id) ? 'bg-cyan-500/20 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <div className="text-[10px] flex items-center justify-center h-full font-bold">{u.name[0]}</div>}
                                            </div>
                                            <span className={`text-sm ${selectedUsers.includes(u._id) ? 'text-cyan-400' : 'text-gray-300'}`}>{u.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <Button type="submit" variant="primary" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'CREATE PROTOCOL'}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-cyan-900/20 border border-cyan-500/50 rounded-lg">
                            <p className="text-xs text-cyan-300 mb-2">ACCESS CODE GENERATED</p>
                            <p className="text-2xl font-mono font-bold text-white tracking-widest select-all">{groupCode}</p>
                        </div>
                        <p className="text-xs text-gray-400">Share this secure key with operatives to allow access.</p>
                        <Button onClick={onClose} variant="secondary" className="w-full border border-white/20 hover:bg-white/10">DONE</Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export function JoinGroupModal({ onClose, onJoined }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupCode: code.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                if (onJoined) onJoined(data.chatId);
                onClose();
            } else {
                setError(data.error || 'Access Denied');
            }
        } catch (error) {
            setError('Connection Failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 border border-cyan-500/30 p-6 rounded-2xl w-96 relative shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>

                <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <Key size={24} /> Enter Access Code
                </h2>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="16-digit secure key" className="bg-black/50 border-white/10 text-white font-mono" />
                    </div>
                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    <Button type="submit" variant="primary" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'AUTHENTICATE'}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
