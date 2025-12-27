"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User, Phone, Mail, Save } from "lucide-react";

export default function ProfilePage() {
    const { customer, refreshCustomer } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        name: customer?.name || "",
        email: customer?.email || "",
    });

    const supabase = createClient();

    const handleSave = async () => {
        if (!customer) return;

        setLoading(true);
        setMessage("");

        try {
            const { error } = await supabase
                .from("customers")
                .update({
                    name: formData.name,
                    email: formData.email || null,
                })
                .eq("id", customer.id);

            if (error) throw error;

            await refreshCustomer();
            setEditing(false);
            setMessage("Profile updated successfully!");
        } catch (error: any) {
            setMessage(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!customer) return null;

    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-serif mb-2">Profile</h1>
                    <p className="text-lg text-muted-foreground">
                        Manage your account settings
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-primary/10 rounded-sm p-8"
                >
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <User className="w-3 h-3 inline mr-1" />
                                Full Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full bg-transparent border-b-2 border-primary/20 py-3 px-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            ) : (
                                <p className="text-lg py-3">{customer.name}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <Phone className="w-3 h-3 inline mr-1" />
                                Phone Number
                            </label>
                            <p className="text-lg py-3 text-muted-foreground">
                                {customer.phone}
                                <span className="ml-2 text-xs">(Cannot be changed)</span>
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                                <Mail className="w-3 h-3 inline mr-1" />
                                Email (Optional)
                            </label>
                            {editing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full bg-transparent border-b-2 border-primary/20 py-3 px-2 focus:outline-none focus:border-primary transition-colors"
                                />
                            ) : (
                                <p className="text-lg py-3">
                                    {customer.email || "Not provided"}
                                </p>
                            )}
                        </div>

                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-sm p-3 rounded-sm ${message.includes("success")
                                        ? "bg-primary/10 text-primary"
                                        : "bg-destructive/10 text-destructive"
                                    }`}
                            >
                                {message}
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-6">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({
                                                name: customer.name,
                                                email: customer.email || "",
                                            });
                                        }}
                                        className="px-6 py-3 border border-primary/20 text-sm uppercase tracking-widest hover:bg-secondary/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
