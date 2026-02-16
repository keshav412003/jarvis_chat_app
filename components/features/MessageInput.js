"use client";

import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

export function MessageInput({ newMessage, onInputChange, onSendMessage, sending, isGroup }) {
    return (
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md">
            <form onSubmit={onSendMessage} className="flex items-center gap-2">
                {!isGroup && (
                    <button type="button" className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <Paperclip size={20} />
                    </button>
                )}
                <div className="flex-1 relative">
                    <Input
                        value={newMessage}
                        onChange={onInputChange}
                        placeholder="Enter secure message..."
                        className="pr-10 bg-black/50 border-white/10 focus:border-cyan-500/40"
                        disabled={sending}
                    />
                </div>
                <Button type="submit" variant="primary" className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30" disabled={sending}>
                    {sending ? <Spinner size="sm" /> : <Send size={18} />}
                </Button>
            </form>
        </div>
    );
}
