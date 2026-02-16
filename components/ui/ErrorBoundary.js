"use client";

import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Protocol Error</h1>
                    <p className="text-gray-400 mb-8 max-w-md">The secure link has been compromised or a system failure occurred. Please reload the interface.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all font-medium"
                    >
                        Re-initialize System
                    </button>
                    {process.env.NODE_ENV !== 'production' && (
                        <div className="mt-8 p-4 bg-red-900/20 border border-red-900/40 rounded-lg text-left max-w-2xl overflow-auto">
                            <code className="text-xs text-red-400">{this.state.error?.toString()}</code>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
