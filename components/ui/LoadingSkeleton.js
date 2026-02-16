import { Skeleton } from './Skeleton';

export function ChatListSkeleton() {
    return (
        <div className="space-y-4 p-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 animate-pulse">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded-lg" />
                        <Skeleton className="h-3 w-1/2 rounded-lg opacity-50" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MessageListSkeleton() {
    return (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-3 rounded-xl space-y-2 ${i % 2 === 0 ? 'bg-gray-900/40 border-white/5' : 'bg-cyan-900/10 border-cyan-500/10'} border`}>
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32 opacity-50" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ChatHeaderSkeleton() {
    return (
        <div className="h-16 border-b border-white/10 flex items-center px-4 gap-3 bg-[#0a0a0a]/80 backdrop-blur-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
            </div>
        </div>
    );
}
