"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import LeftIconNav from '@/components/layout/LeftIconNav';
import SidebarPanel from '@/components/layout/SidebarPanel';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from '@/components/layout/BottomNav';

// Lazy load heavy components to reduce initial bundle size
const StatusWindow = dynamic(
    () => import('@/components/features/StatusWindow').then(mod => ({ default: mod.StatusWindow })),
    {
        loading: () => <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>,
        ssr: false
    }
);

export default function MainLayout({ children }) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Derive activeTab and viewMode from pathname
    const activeTab = useMemo(() => {
        if (pathname.startsWith('/status')) return 'status';
        if (pathname.startsWith('/people') || pathname.startsWith('/users')) return 'users';
        if (pathname.startsWith('/settings')) return 'settings';
        return 'chats';
    }, [pathname]);

    const viewMode = useMemo(() => {
        if (pathname.startsWith('/status')) return 'status';
        return 'chat';
    }, [pathname]);

    // Detect if we are in a "Detail View" (Chat or Story)
    const isDetailView = useMemo(() => {
        // Chat detail: /chat/[chatId]
        if (params?.chatId) return true;
        // Status detail: /status/[id]
        if (pathname.startsWith('/status/') && params?.id) return true;
        return false;
    }, [params, pathname]);

    const selectedStatusId = params?.id || null;

    // Detect Mobile Screen
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
                setLoading(false);
            });
    }, [router]);

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black gap-4 text-cyan-500 font-mono">
            <Spinner size="lg" />
            <span className="text-sm tracking-widest animate-pulse">INITIALIZING SECURE ENVIRONMENT...</span>
        </div>
    );

    const handleTabChange = (tab) => {
        if (tab === 'chats') router.push('/chat');
        else if (tab === 'status') router.push('/status');
        else if (tab === 'users') router.push('/people');
        else if (tab === 'settings') router.push('/settings');
    };

    return (
        <div className="flex h-[100dvh] w-full bg-[#050505] overflow-hidden relative">
            {/* 
              DESKTOP LAYOUT (md:flex) 
              - Shows LeftIconNav + SidebarPanel + Main Content side-by-side
            */}
            <div className={`hidden md:flex h-full w-full`}>
                <LeftIconNav
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    user={user}
                />

                <SidebarPanel
                    activeTab={activeTab}
                    user={user}
                    setActiveTab={handleTabChange}
                    onStatusSelect={(id) => router.push(`/status/${id}`)}
                />

                <main className="flex-1 h-full relative flex flex-col bg-cover bg-center" style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/705/966/38/iron-man-jarvis-technology-marvel-comics-wallpaper-preview.jpg')" }}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    <div className="relative z-10 flex-1 flex flex-col min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.15, ease: "easeInOut" }}
                                className="flex-1 flex flex-col min-h-0"
                            >
                                {viewMode === 'status' && selectedStatusId ? (
                                    <StatusWindow
                                        initialStatusId={selectedStatusId}
                                        onClose={() => router.push('/status')}
                                    />
                                ) : (
                                    children
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* 
              MOBILE LAYOUT (md:hidden)
              - Single Pane View
              - Switches between SidebarPanel (List) and Main Content (Detail)
            */}
            <div className="md:hidden w-full h-full relative font-sans flex flex-col">
                {/* Mobile Background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('https://c4.wallpaperflare.com/wallpaper/705/966/38/iron-man-jarvis-technology-marvel-comics-wallpaper-preview.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                </div>

                {/* SLIDE TRANSITIONS CONTAINER */}
                <div className="relative w-full flex-1 overflow-hidden z-10">
                    {/* LIST VIEW (SidebarPanel) */}
                    <div
                        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${isDetailView ? '-translate-x-full' : 'translate-x-0'} pb-16`}
                    >
                        <SidebarPanel
                            activeTab={activeTab}
                            user={user}
                            setActiveTab={handleTabChange}
                            onStatusSelect={(id) => router.push(`/status/${id}`)}
                            isMobile={true}
                        />
                    </div>

                    {/* DETAIL VIEW (Children / ChatWindow / StatusWindow) */}
                    <div
                        className={`absolute inset-0 w-full h-full bg-black transition-transform duration-300 ease-in-out ${isDetailView ? 'translate-x-0' : 'translate-x-full'}`}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={pathname}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="w-full h-full"
                            >
                                {viewMode === 'status' && selectedStatusId ? (
                                    <StatusWindow
                                        initialStatusId={selectedStatusId}
                                        onClose={() => router.push('/status')}
                                    />
                                ) : (
                                    children
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* BOTTOM NAVIGATION (Visible only when NOT in detail view) */}
                {!isDetailView && (
                    <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
                )}
            </div>
        </div>
    );
}

