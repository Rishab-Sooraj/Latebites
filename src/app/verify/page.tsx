"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided");
            return;
        }

        // Call verification API
        fetch(`/api/verify?token=${token}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.verified || data.alreadyVerified) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.error || "Verification failed");
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Failed to verify email. Please try again.");
            });
    }, [token]);

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full text-center"
            >
                {status === "loading" && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-lg font-light text-muted-foreground">Verifying your email...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-light text-foreground">
                                Email Verified!
                            </h1>
                            <p className="text-base font-light text-muted-foreground leading-relaxed">
                                {message}
                            </p>
                            <p className="text-sm font-light text-muted-foreground pt-4">
                                Our team will review your application and contact you within 2-3 business days.
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="inline-block mt-8 px-8 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-destructive"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-light text-foreground">
                                Verification Failed
                            </h1>
                            <p className="text-base font-light text-muted-foreground leading-relaxed">
                                {message}
                            </p>
                            <p className="text-sm font-light text-muted-foreground pt-4">
                                Please contact us if you continue to experience issues.
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="inline-block mt-8 px-8 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-opacity"
                        >
                            Back to Home
                        </Link>
                    </div>
                )}
            </motion.div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </main>
        }>
            <VerifyContent />
        </Suspense>
    );
}
