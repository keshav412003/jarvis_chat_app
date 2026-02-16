"use client";

import { use, useState, useEffect } from 'react';
import { ChatWindow } from '@/components/features/ChatWindow';

export default function ChatPage({ params }) {
    // Use `use()` for unlocking params in Next.js 15+ if needed, or just standard prop access
    // Since we are in client component, we might get params as promise in newer Next.js
    // But standard way for now:
    const resolvedParams = use(params); // Next 15 specific
    const chatId = resolvedParams.chatId;

    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => setUser(data.user));
    }, []);

    return (
        <ChatWindow key={chatId} chatId={chatId} user={user} />
    );
}
