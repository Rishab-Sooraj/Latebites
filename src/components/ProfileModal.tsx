"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, Loader2, Save, Sparkles, ShieldCheck, Fingerprint, AtSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { customer, refreshProfile } = useAuth();
    const [name, setName] = useState(customer?.name || "");
    const [phone, setPhone] = useState(customer?.phone || "");
    const [email, setEmail] = useState(customer?.email || "");
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (customer) {
            setName(customer.name || "");
            setPhone(customer.phone || "");
            setEmail(customer.email || "");
        }
    }, [customer]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;

        setLoading(true);
        try {
            // Update customer profile
            const { error: customerError } = await supabase
                .from("customers")
                .update({ name, phone })
                .eq("id", customer.id);

            if (customerError) throw customerError;

            // Note: Email updates usually happen via Supabase Auth updateCurrentUser, 
            // but for this demo/MVP we'll assume name/phone is enough or email is handled separately.
            // If the user changed the email, we'd need to handle verification.

            await refreshProfile();
            toast.success("Identity updated successfully");
            onClose();
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-[48px] shadow-2xl overflow-hidden"
                    >
                        {/* Premium Header Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-500 to-amber-500" />
                        
                        <div className="p-10 pb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight">Identity Protocol</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black mt-1">Personnel Authorization</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-gray-50 hover:bg-black hover:text-white flex items-center justify-center transition-all duration-300 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="px-10 pb-10">
                            <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
                                <form onSubmit={handleSave} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-[0.4em] font-black text-primary ml-1">Assigned Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="block w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold placeholder:text-gray-300"
                                                placeholder="Rescuer Name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-[0.4em] font-black text-primary ml-1">Communication Line</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <Phone className="h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="block w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold placeholder:text-gray-300"
                                                placeholder="+91 00000 00000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-[0.4em] font-black text-primary ml-1">Digital Address</label>
                                        <div className="relative group opacity-60">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                <AtSign className="h-4 w-4 text-gray-300" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                readOnly
                                                className="block w-full pl-14 pr-6 py-5 bg-gray-100/50 border border-gray-100 rounded-2xl cursor-not-allowed text-sm font-bold"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest text-center mt-2">Email verification is locked for security</p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-6 bg-black text-white text-[10px] uppercase tracking-[0.4em] font-black rounded-2xl hover:bg-primary hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-4 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                            {loading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                    Commit Authorization
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="px-10 py-6 bg-gray-50 flex items-center justify-center gap-3">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Encrypted End-to-End Profile Security</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
