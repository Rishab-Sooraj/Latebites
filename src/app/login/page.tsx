"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Phone, Mail, ArrowRight, Eye, EyeOff, User, Store, Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect");

    const [step, setStep] = useState<"role" | "auth">("role");
    const [selectedRole, setSelectedRole] = useState<"customer" | "restaurant" | null>(null);
    const [hoveredRole, setHoveredRole] = useState<"customer" | "restaurant" | null>(null);
    const [authMethod, setAuthMethod] = useState<"phone" | "email">("email");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleRoleSelect = (role: "customer" | "restaurant") => {
        setSelectedRole(role);
        setStep("auth");
        setError("");
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            const tableName = selectedRole === "customer" ? "customers" : "restaurants";
            const { data: profileData, error: profileError } = await supabase
                .from(tableName)
                .select("id")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (profileError || !profileData) {
                await supabase.auth.signOut();
                throw new Error(`No ${selectedRole} account found. Please check your role selection or sign up.`);
            }

            const defaultRedirect = selectedRole === "customer" ? "/browse" : "/restaurant/dashboard";
            router.push(redirect || defaultRedirect);
        } catch (err: any) {
            setError(err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");

        try {
            const defaultRedirect = selectedRole === "customer" ? "/browse" : "/restaurant/dashboard";
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect || defaultRedirect}&role=${selectedRole}`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to sign in with Google");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated gradient background */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: hoveredRole === "restaurant"
                        ? "linear-gradient(to bottom right, rgb(239 246 255), rgb(219 234 254), rgb(191 219 254))"
                        : "linear-gradient(to bottom right, rgb(255 247 237), rgb(254 243 199), rgb(254 249 195))"
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: hoveredRole === "restaurant"
                            ? "radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 50%)"
                            : "radial-gradient(circle at top right, rgba(251, 146, 60, 0.15), transparent 50%)"
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute inset-0"
                    animate={{
                        background: hoveredRole === "restaurant"
                            ? "radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.15), transparent 50%)"
                            : "radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.15), transparent 50%)"
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </motion.div>

            {/* Floating orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    background: hoveredRole === "restaurant"
                        ? "linear-gradient(to bottom right, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))"
                        : "linear-gradient(to bottom right, rgba(251, 146, 60, 0.3), rgba(245, 158, 11, 0.3))"
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                    background: hoveredRole === "restaurant"
                        ? "linear-gradient(to bottom right, rgba(147, 197, 253, 0.3), rgba(59, 130, 246, 0.3))"
                        : "linear-gradient(to bottom right, rgba(253, 224, 71, 0.3), rgba(251, 146, 60, 0.3))"
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Glass card */}
                    <div className="bg-white/70 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-white/20 shadow-2xl shadow-orange-500/10">
                        {/* Logo with sparkle */}
                        <motion.div
                            className="text-center mb-8"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Link href="/" className="group inline-block">
                                <div className="relative">
                                    <h1 className="text-5xl font-serif italic bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent cursor-pointer group-hover:scale-105 transition-transform duration-300">
                                        Latebites
                                    </h1>
                                    <motion.div
                                        animate={{
                                            rotate: [0, 360],
                                            scale: [1, 1.2, 1],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                    </motion.div>
                                </div>
                            </Link>
                            <p className="text-sm text-gray-600 mt-3 font-medium tracking-wide">
                                Rescue food with dignity
                            </p>
                        </motion.div>

                        {step === "role" ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-3xl font-serif mb-2 text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Welcome back
                                </h2>
                                <p className="text-sm text-gray-600 mb-8 text-center font-medium">
                                    Select your role to continue
                                </p>

                                <div className="space-y-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onMouseEnter={() => setHoveredRole("customer")}
                                        onMouseLeave={() => setHoveredRole(null)}
                                        onClick={() => handleRoleSelect("customer")}
                                        className="w-full p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200/50 rounded-2xl hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-4 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Customer</h3>
                                                <p className="text-sm text-gray-600 font-medium">Browse and rescue food</p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onMouseEnter={() => setHoveredRole("restaurant")}
                                        onMouseLeave={() => setHoveredRole(null)}
                                        onClick={() => handleRoleSelect("restaurant")}
                                        className="w-full p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-2xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <Store className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-900">Restaurant</h3>
                                                <p className="text-sm text-gray-600 font-medium">Manage rescue bags</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <button
                                    onClick={() => {
                                        setStep("role");
                                        setSelectedRole(null);
                                        setError("");
                                    }}
                                    className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-1 font-medium transition-colors"
                                >
                                    ← Change role
                                </button>

                                <h2 className="text-3xl font-serif mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    Sign in as {selectedRole === "customer" ? "Customer" : "Restaurant"}
                                </h2>
                                <p className="text-sm text-gray-600 mb-8 font-medium">
                                    {selectedRole === "customer"
                                        ? "Choose your sign-in method"
                                        : "Enter your credentials to continue"}
                                </p>

                                {/* Google Sign-In - Only for Customers */}
                                {selectedRole === "customer" && (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleGoogleSignIn}
                                            disabled={loading}
                                            className="w-full py-4 px-6 bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm font-semibold rounded-xl mb-6 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            <span className="relative z-10">Continue with Google</span>
                                        </motion.button>

                                        {/* Divider */}
                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white/70 backdrop-blur-sm px-3 text-gray-500 font-semibold tracking-wider">Or continue with email</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Email Login Form */}
                                <form onSubmit={handleEmailLogin} className="space-y-5">
                                    <div>
                                        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-3">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-white/50 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-400 rounded-xl py-3.5 px-4 focus:outline-none focus:ring-4 focus:ring-orange-400/10 transition-all duration-300 font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-3">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                                className="w-full bg-white/50 backdrop-blur-sm border-2 border-gray-200 focus:border-orange-400 rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:ring-4 focus:ring-orange-400/10 transition-all duration-300 font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-sm p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white text-sm uppercase tracking-widest font-bold rounded-xl hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <span className="relative z-10">{loading ? "Signing in..." : "Sign In"}</span>
                                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>

                                    <div className="text-center pt-2">
                                        <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                </form>

                                {/* Signup Link */}
                                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Don't have an account?{" "}
                                        <Link href="/signup" className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-colors">
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Back to Home */}
                    <motion.div
                        className="text-center mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors inline-flex items-center gap-1 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Back to home
                        </Link>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
}
