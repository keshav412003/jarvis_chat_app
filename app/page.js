import Link from 'next/link';
import { Zap } from 'lucide-react';
import LandingHero from '@/components/features/LandingHero';
import FeatureGrid from '@/components/features/FeatureGrid';
import BackgroundEffects from '@/components/features/BackgroundEffects';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 flex flex-col">
            <BackgroundEffects />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                        <Zap size={16} className="text-cyan-400" />
                    </div>
                    <span className="font-bold tracking-widest text-lg">JARVIS</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="text-sm px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
                <LandingHero />
                <FeatureGrid />
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-xs text-gray-600 border-t border-white/5 mt-20">
                <p>&copy; 2026 JARVIS SYSTEMS. ALL RIGHTS RESERVED.</p>
            </footer>
        </div>
    );
}
