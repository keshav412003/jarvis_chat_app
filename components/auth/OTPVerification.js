"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function OTPVerification({ email, onVerified, onResend }) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Enable resend after 60 seconds
        const resendTimer = setTimeout(() => {
            setCanResend(true);
        }, 60000);

        return () => {
            clearInterval(timer);
            clearTimeout(resendTimer);
        };
    }, []);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleVerify = async () => {
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter a complete 6-digit code.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Verification failed");
            }

            const { verificationToken } = data;
            onVerified(verificationToken);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendClick = async () => {
        if (!canResend) return;

        setError("");
        setLoading(true);

        try {
            await onResend();
            setCanResend(false);
            setTimeLeft(600); // Reset expiry timer visual
            // Reset resend timer
            setTimeout(() => {
                setCanResend(true);
            }, 60000);
        } catch (err) {
            setError(err.message || "Failed to resend");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] relative z-10"
        >
            <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Verify Email</h2>
            <p className="text-gray-400 text-center mb-8">
                Enter the 6-digit code sent to <span className="text-cyan-400">{email}</span>
            </p>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="flex justify-center gap-2 mb-8">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 bg-white/5 border border-white/10 rounded-lg text-center text-2xl text-white focus:border-cyan-500 focus:outline-none focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                    />
                ))}
            </div>

            <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
                {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="flex flex-col items-center gap-2 text-sm">
                <span className="text-gray-500">Code expires in {formatTime(timeLeft)}</span>

                <button
                    onClick={handleResendClick}
                    disabled={!canResend || loading}
                    className={`transition-colors ${canResend ? 'text-cyan-400 hover:text-cyan-300 cursor-pointer' : 'text-gray-600 cursor-not-allowed'}`}
                >
                    Resend Code {canResend ? '' : `(${60 - (600 - timeLeft) > 0 ? 'Wait ' + (60 - (600 - timeLeft)) + 's' : 'Wait...'})`}
                    {/* Logic for cooldown display is simplified here, better to track separate cooldown state */}
                    {canResend ? "" : "(Wait 60s)"}
                </button>
            </div>
        </motion.div>
    );
}
