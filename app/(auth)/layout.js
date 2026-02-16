export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[url('https://wallpapers.com/images/hd/iron-man-hud-jarvis-4k-scifi-art-t860551370i01t4f.jpg')] bg-cover bg-center bg-no-repeat relative">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" /> {/* Overlay */}

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" />
                <div className="relative z-20">
                    {children}
                </div>

                {/* Decorative borders */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl -translate-x-2 -translate-y-2" />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl translate-x-2 translate-y-2" />
            </div>
        </div>
    );
}
