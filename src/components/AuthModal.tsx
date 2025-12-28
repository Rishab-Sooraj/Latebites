"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type AuthStep = "role" | "email" | "login" | "signup";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<AuthStep>("role");
    const [role, setRole] = useState<"customer" | "restaurant">("customer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep("role");
            setRole("customer");
            setEmail("");
            setPassword("");
            setName("");
            setPhone("");
            setError("");
        }
    }, [isOpen]);

    const checkEmailExists = async () => {
        setLoading(true);
        setError("");

        try {
            // Try to sign in with a dummy password to check if email exists
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: "dummy-check-password-that-will-fail",
            });

            // If error is "Invalid login credentials", email exists
            if (error?.message.includes("Invalid login credentials")) {
                setStep("login");
            } else if (error?.message.includes("Email not confirmed")) {
                setStep("login");
            } else {
                // Email doesn't exist, go to signup
                setStep("signup");
            }
        } catch (err) {
            // Default to signup if we can't determine
            setStep("signup");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log("Attempting login for:", email, "as", role);

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log("Auth response:", { authData, authError });

            if (authError) {
                if (authError.message.includes("Invalid login credentials")) {
                    throw new Error("Incorrect password. Please try again.");
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error("No user returned from login");
            }

            console.log("User authenticated:", authData.user.id);

            // Check if profile exists in the correct table based on role
            const tableName = role === "customer" ? "customers" : "restaurants";
            const { data: profileData, error: profileError } = await supabase
                .from(tableName)
                .select("id")
                .eq("id", authData.user.id)
                .maybeSingle();

            console.log("Profile check in", tableName, ":", { profileData, profileError });

            if (profileError || !profileData) {
                await supabase.auth.signOut();
                throw new Error(`No ${role} profile found. Please check your role selection or sign up again.`);
            }

            console.log("Login successful, redirecting...");
            onClose();

            // Redirect based on role
            const redirectPath = role === "customer" ? "/browse" : "/restaurant/dashboard";
            router.push(redirectPath);
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const { data, error: signupError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        phone: phone.startsWith("+") ? phone : `+91${phone}`,
                    },
                },
            });

            if (signupError) throw signupError;

            if (data.user) {
                // Create customer profile
                const { error: profileError } = await supabase.from("customers").insert([{
                    id: data.user.id,
                    name,
                    phone: phone.startsWith("+") ? phone : `+91${phone}`,
                    email,
                }]);

                if (profileError) {
                    console.error("Profile creation error:", profileError);
                }

                onClose();
                router.push("/browse");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?redirect=/browse&role=customer`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google");
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Logo */}
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-serif italic bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                                    Latebites
                                </h1>
                                <p className="text-sm text-gray-600 mt-2">
                                    {step === "role" && "Welcome! Choose your account type"}
                                    {step === "email" && "Enter your email to continue"}
                                    {step === "login" && "Welcome back!"}
                                    {step === "signup" && "Create your account"}
                                </p>
                            </div>

                            {/* Role Selection Step */}
                            {step === "role" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRole("customer");
                                                setStep("email");
                                            }}
                                            className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                        >
                                            <div className="text-4xl mb-2">🍽️</div>
                                            <div className="font-semibold text-gray-900 group-hover:text-orange-600">Customer</div>
                                            <div className="text-xs text-gray-500 mt-1">Rescue surplus food</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRole("restaurant");
                                                setStep("email");
                                            }}
                                            className="p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                                        >
                                            <div className="text-4xl mb-2">🏪</div>
                                            <div className="font-semibold text-gray-900 group-hover:text-orange-600">Restaurant</div>
                                            <div className="text-xs text-gray-500 mt-1">List surplus food</div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Email Step */}
                            {step === "email" && (
                                <form onSubmit={(e) => { e.preventDefault(); checkEmailExists(); }} className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Mail className="w-3 h-3 inline mr-1" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !email}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? "Checking..." : "Continue"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleSignIn}
                                        className="w-full py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Continue with Google
                                    </button>
                                </form>
                            )}

                            {/* Login Step */}
                            {step === "login" && (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Mail className="w-3 h-3 inline mr-1" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setStep("email")}
                                            className="text-xs text-orange-600 hover:underline mt-1"
                                        >
                                            Change email
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Lock className="w-3 h-3 inline mr-1" />
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            autoFocus
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !password}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? "Signing in..." : "Sign In"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            {/* Signup Step */}
                            {step === "signup" && (
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Mail className="w-3 h-3 inline mr-1" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setStep("email")}
                                            className="text-xs text-orange-600 hover:underline mt-1"
                                        >
                                            Change email
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <User className="w-3 h-3 inline mr-1" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                            autoFocus
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            Phone Number
                                        </label>
                                        <div className="flex gap-2">
                                            <span className="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                                                +91
                                            </span>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                                placeholder="9876543210"
                                                required
                                                maxLength={10}
                                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-600 block mb-2">
                                            <Lock className="w-3 h-3 inline mr-1" />
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !name || phone.length !== 10 || password.length < 6}
                                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? "Creating account..." : "Create Account"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
