"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { User, Phone, Mail, ArrowRight, Eye, EyeOff, Lock } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
    });

    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validate password
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            console.log("Starting signup process...");

            // Sign up with email and password (disable email confirmation)
            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/browse`,
                    data: {
                        name: formData.name,
                        phone: formData.phone.startsWith("+") ? formData.phone : `+91${formData.phone}`,
                    },
                },
            });

            console.log("Signup response:", { data, error: signupError });

            if (signupError) {
                console.error("Signup error:", signupError);
                throw signupError;
            }

            if (!data.user) {
                throw new Error("No user returned from signup");
            }

            console.log("User created:", data.user.id);

            // Create customer profile
            const profileData = {
                id: data.user.id,
                name: formData.name,
                phone: formData.phone.startsWith("+") ? formData.phone : `+91${formData.phone}`,
                email: formData.email,
            };

            console.log("Creating profile with data:", profileData);

            const { error: profileError } = await supabase.from("customers").insert([profileData]);

            if (profileError) {
                console.error("Profile creation error:", profileError);
                setError(`Account created but profile failed: ${profileError.message}. Please contact support.`);
                setLoading(false);
                return;
            }

            console.log("Profile created successfully!");

            // Redirect to browse page immediately
            router.push("/browse");
        } catch (err: any) {
            console.error("Signup failed:", err);
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
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
                    <p className="text-sm text-muted-foreground mt-2 tracking-wide">
                        Start rescuing food today
                    </p>
                </div>

                {/* Signup Card */}
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-sm border border-primary/10 shadow-lg">
                    <h2 className="text-2xl font-serif mb-2">Create your account</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Join the movement to reduce food waste
                    </p>

                    <form onSubmit={handleSignup} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <User className="w-3 h-3 inline mr-1" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Rajesh Kumar"
                                required
                                minLength={2}
                                className="w-full bg-transparent border-b-2 border-primary/20 py-3 px-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <Mail className="w-3 h-3 inline mr-1" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                required
                                className="w-full bg-transparent border-b-2 border-primary/20 py-3 px-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <Phone className="w-3 h-3 inline mr-1" />
                                Phone Number
                            </label>
                            <div className="flex gap-2">
                                <span className="bg-secondary/20 px-4 py-3 border-b-2 border-primary/20 text-sm">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                                    }
                                    placeholder="9876543210"
                                    required
                                    maxLength={10}
                                    className="flex-1 bg-transparent border-b-2 border-primary/20 py-3 px-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <Lock className="w-3 h-3 inline mr-1" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-transparent border-b-2 border-primary/20 py-3 px-2 pr-10 focus:outline-none focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                At least 6 characters
                            </p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-sm p-3 rounded-sm ${error.includes("check your email")
                                    ? "bg-primary/10 text-primary"
                                    : "bg-destructive/10 text-destructive"
                                    }`}
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Terms */}
                        <div className="text-xs text-muted-foreground">
                            By signing up, you agree to our{" "}
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.name.length < 2 || formData.phone.length !== 10 || formData.password.length < 6}
                            className="w-full py-4 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 pt-6 border-t border-primary/10 text-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary font-medium hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
