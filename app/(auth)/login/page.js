"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

// Lazy load 3D component to avoid performance hit on initial load
const SuccessAnimation = dynamic(() => import('@/components/features/SuccessAnimation'), {
    ssr: false,
    loading: () => <div className="text-cyan-500 font-mono text-center">INITIALIZING WARP DRIVE...</div>
});

const InteractiveBackground = dynamic(() => import('@/components/features/InteractiveBackground'), {
    ssr: false,
});

const SplashCursor = dynamic(() => import('@/components/features/SplashCursor'), {
    ssr: false,
});

export default function LoginPage() {
    const router = useRouter();

    // View States: 'LOGIN', 'FORGOT_CONFIRM', 'FORGOT_OTP', 'FORGOT_NEW_PASS', 'FORGOT_SUCCESS'
    const [viewState, setViewState] = useState('LOGIN');

    // Login State
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });

    // Forgot Password State
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationToken, setVerificationToken] = useState(null);

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            router.push('/');
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

            setViewState('FORGOT_OTP');
            setSuccessMsg(`OTP sent to ${resetEmail}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Invalid OTP');

            setVerificationToken(data.verificationToken);
            setViewState('FORGOT_NEW_PASS');
            setSuccessMsg('OTP Verified. Enter new password.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: resetEmail,
                    password: newPassword,
                    verificationToken
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reset failed');

            setViewState('FORGOT_SUCCESS');
            setSuccessMsg(''); // Clear text msg to let animation speak

            // Auto Login Attempt or Switch to Login View after animation
            setTimeout(() => {
                setViewState('LOGIN');
                setLoginData({ identifier: resetEmail, password: '' });
                setNewPassword('');
                setConfirmPassword('');
                setOtp('');
                setSuccessMsg('Password updated! Please login.');
            }, 5000); // Wait 5s for full animation

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const backToLogin = () => {
        setViewState('LOGIN');
        setError('');
        setSuccessMsg('');
    };

    // Special Fullscreen Render for Success Animation
    if (viewState === 'FORGOT_SUCCESS') {
        return <SuccessAnimation />;
    }

    return (
        <>
            <InteractiveBackground />
            <SplashCursor />
            <AnimatePresence mode="wait">
                <motion.div
                    key={viewState}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-10"
                >
                    {/* HEADERS */}
                    <div className="text-center space-y-4 mb-4">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            {viewState === 'LOGIN' && 'WELCOME BACK'}
                            {viewState === 'FORGOT_CONFIRM' && 'CONFIRM IDENTITY'}
                            {viewState === 'FORGOT_OTP' && 'VERIFY IDENTITY'}
                            {viewState === 'FORGOT_NEW_PASS' && 'SECURE ACCESS'}
                        </h1>
                        <p className="text-gray-400 text-sm tracking-wider uppercase">
                            {viewState === 'LOGIN' && 'INITIATE LOGIN SEQUENCE'}
                            {viewState === 'FORGOT_CONFIRM' && 'VERIFY TARGET ACCOUNT'}
                            {viewState === 'FORGOT_OTP' && 'ENTER 6-DIGIT CODE'}
                            {viewState === 'FORGOT_NEW_PASS' && 'SET NEW CREDENTIALS'}
                        </p>
                    </div>

                    {/* ALERTS */}
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">{error}</div>}
                    {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center">{successMsg}</div>}

                    {/* FORMS */}
                    {viewState === 'LOGIN' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-cyan-500/80 uppercase tracking-widest pl-1">Identity</label>
                                <Input placeholder="Email" value={loginData.identifier} onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-cyan-500/80 uppercase tracking-widest pl-1">Passcode</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!loginData.identifier) {
                                            setError("Please enter your Email or Phone in the Identity field first.");
                                            return;
                                        }
                                        setResetEmail(loginData.identifier);
                                        setViewState('FORGOT_CONFIRM');
                                        setError('');
                                    }}
                                    className="text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                                >
                                    Forgot Credentials?
                                </button>
                            </div>
                            <Button type="submit" className="w-full mt-4 flex justify-center items-center gap-2" disabled={loading}>
                                {loading ? <><Spinner size="sm" /> AUTHENTICATING...</> : 'ACCESS SYSTEM'}
                            </Button>
                        </form>
                    )}

                    {viewState === 'FORGOT_CONFIRM' && (
                        <div className="space-y-4 text-center">
                            <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
                                <p className="text-sm text-gray-300 mb-2">Initiate Password Recovery for:</p>
                                <p className="text-lg font-mono font-bold text-cyan-400 break-all">{resetEmail}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                                We will send a verification code to this address.
                            </p>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={backToLogin} className="flex-1">CANCEL</Button>
                                <Button type="button" onClick={handleRequestOtp} className="flex-1" disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : 'CONFIRM & SEND'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {viewState === 'FORGOT_OTP' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-cyan-500/80 uppercase tracking-widest pl-1">Verification Code</label>
                                <Input placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={() => setViewState('FORGOT_CONFIRM')} className="flex-1">BACK</Button>
                                <Button type="submit" className="flex-1" disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : 'VERIFY'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {viewState === 'FORGOT_NEW_PASS' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-cyan-500/80 uppercase tracking-widest pl-1">New Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="New Secure Passcode"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-cyan-500/80 uppercase tracking-widest pl-1">Confirm Password</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm Passcode"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Spinner size="sm" /> : 'UPDATE CREDENTIALS'}
                            </Button>
                        </form>
                    )}

                    {/* FOOTER (Only for Login) */}
                    {viewState === 'LOGIN' && (
                        <div className="text-center text-sm mt-4 text-gray-500">
                            New User?{' '}
                            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                Initialize Registration
                            </Link>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
}
