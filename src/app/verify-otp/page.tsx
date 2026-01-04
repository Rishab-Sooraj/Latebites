"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

function VerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone") || "";
    const isSignup = searchParams.get("signup") === "true";
    const redirect = searchParams.get("redirect") || "/browse";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [countdown, setCountdown] = useState(30);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const supabase = createClient();

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered
        if (newOtp.every((digit) => digit !== "") && index === 5) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpCode?: string) => {
        const code = otpCode || otp.join("");
        if (code.length !== 6) return;

        setLoading(true);
        setError("");

        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                phone: phone.startsWith("+") ? phone : `+91${phone}`,
                token: code,
                type: "sms",
            });

            if (verifyError) throw verifyError;

            // If signup, create customer profile
            if (isSignup && data.user) {
                const signupData = JSON.parse(sessionStorage.getItem("signupData") || "{}");

                const { error: profileError } = await supabase.from("customers").insert({
                    id: data.user.id,
                    name: signupData.name,
                    phone: signupData.phone.startsWith("+") ? signupData.phone : `+91${signupData.phone}`,
                    email: signupData.email || null,
                });

                if (profileError) {
                    console.error("Error creating profile:", profileError);
                }

                sessionStorage.removeItem("signupData");
            }

            // Redirect to browse or specified redirect
            router.push(redirect);
        } catch (err: any) {
            setError(err.message || "Invalid OTP. Please try again.");
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone.startsWith("+") ? phone : `+91${phone}`,
                options: {
                    channel: "sms",
                },
            });

            if (error) throw error;

            setCanResend(false);
            setCountdown(30);
            setError("OTP sent successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-100 via-blue-100 to-teal-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <motion.h1
                            className="text-4xl font-serif italic text-primary cursor-pointer hover:opacity-80 transition-opacity"
                            whileHover={{ scale: 1.05 }}
                        >
                            Latebites
                        </motion.h1>
                    </Link>
                </div>

                {/* OTP Card */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-sm border border-primary/10 shadow-lg">
                    <h2 className="text-2xl font-serif mb-2">Verify your number</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        We sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">+91 {phone}</span>
                    </p>

                    {/* OTP Input */}
                    <div className="flex gap-2 mb-6">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-full aspect-square text-center text-2xl font-bold bg-transparent border-2 border-primary/20 focus:border-primary focus:outline-none transition-colors rounded-sm"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-sm p-3 rounded-sm mb-4 ${error.includes("sent successfully")
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                                }`}
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        onClick={() => handleVerify()}
                        disabled={loading || otp.some((digit) => !digit)}
                        className="w-full py-4 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Resend OTP */}
                    <div className="text-center">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="text-sm text-primary hover:underline disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                            >
                                <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                                {resending ? "Sending..." : "Resend OTP"}
                            </button>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Resend OTP in {countdown}s
                            </p>
                        )}
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <Link
                        href={isSignup ? "/signup" : "/"}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Change phone number
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
