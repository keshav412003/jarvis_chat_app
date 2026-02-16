"use client";

import dynamic from 'next/dynamic';

const InteractiveBackground = dynamic(() => import('@/components/features/InteractiveBackground'), {
    ssr: false,
});

const SplashCursor = dynamic(() => import('@/components/features/SplashCursor'), {
    ssr: false,
});

export default function BackgroundEffects() {
    return (
        <>
            <InteractiveBackground />
            <SplashCursor />
        </>
    );
}
