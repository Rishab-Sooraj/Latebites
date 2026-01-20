"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Phone, MessageCircle, Search, HelpCircle, ArrowLeft, Sparkles, LifeBuoy, Zap, Shield, Headphones } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqs: FAQItem[] = [
    {
        category: "Rescue Missions",
        question: "How do I initiate a rescue mission?",
        answer: "Browse active rescue bags in the 'Deployment' section, select your target bag, and commit to the rescue. You'll receive a digital manifest with precise pickup coordinates and timing.",
    },
    {
        category: "Rescue Missions",
        question: "What is a Rescue Bag?",
        answer: "A rescue bag contains high-quality surplus food from artisanal kitchens that would otherwise be lost. By rescuing it, you're preventing waste and securing a premium meal at a 50% discount.",
    },
    {
        category: "Logistics",
        question: "When should I arrive for pickup?",
        answer: "Each mission has a strict pickup window, typically during the final hours of the kitchen's operation. Please arrive within this window to ensure a smooth handover.",
    },
    {
        category: "Protocols",
        question: "Can I cancel a committed rescue?",
        answer: "Commitments can be rescinded up to 2 hours before the pickup window begins. This allows other rescuers to be deployed. Late cancellations disrupt the zero-waste ecosystem.",
    },
    {
        category: "Security",
        question: "Is my data protected?",
        answer: "Your identity and communication lines are protected by end-to-end encryption protocols. We only share necessary deployment data with restaurant partners.",
    },
];

const categories = ["All", "Rescue Missions", "Logistics", "Protocols", "Security"];

export default function HelpPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const filteredFAQs = faqs.filter((faq) => {
        const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="relative min-h-screen bg-[#FEFCF9] selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            <Header />

            {/* Premium Dynamic Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-primary/10 via-orange-400/5 to-transparent blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 30, repeat: Infinity }}
                    className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tl from-emerald-500/5 via-teal-400/5 to-transparent blur-[120px]"
                />
            </div>

            <main className="pt-32 pb-24 relative px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="max-w-3xl mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-xl">
                                    <LifeBuoy className="w-5 h-5" />
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary">Latebites Concierge</p>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-serif leading-tight">Protocol <span className="italic">Assistance</span></h1>
                            <p className="text-muted-foreground font-light text-xl tracking-wide leading-relaxed">
                                Access deployment guides, mission protocols, and direct communication lines with Latebites HQ.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        {/* FAQ Section */}
                        <div className="lg:col-span-8 space-y-12">
                            {/* Search & Filter */}
                            <div className="space-y-8">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-primary/10 rounded-[32px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                    <div className="relative bg-white border border-primary/5 rounded-[32px] shadow-xl shadow-black/[0.02] p-2 flex items-center">
                                        <div className="flex-1 flex items-center px-6 py-4">
                                            <Search className="w-5 h-5 text-muted-foreground/30 mr-4 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search mission protocols..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-lg placeholder:text-muted-foreground/40 font-light"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                                selectedCategory === category
                                                ? "bg-black text-white shadow-xl shadow-black/10"
                                                : "bg-white border border-primary/5 text-muted-foreground hover:border-primary/20"
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* FAQ Accordion */}
                            <div className="space-y-4">
                                {filteredFAQs.map((faq, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-[32px] border border-primary/5 overflow-hidden group hover:border-primary/20 transition-all duration-500"
                                    >
                                        <button
                                            onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                                            className="w-full p-8 text-left flex items-start justify-between gap-6"
                                        >
                                            <div className="flex-1">
                                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary mb-3">{faq.category}</p>
                                                <h3 className="text-xl font-serif group-hover:translate-x-1 transition-transform duration-500">{faq.question}</h3>
                                            </div>
                                            <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center transition-all duration-500 ${expandedFAQ === index ? 'rotate-180 bg-black text-white' : ''}`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedFAQ === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-8 pb-8"
                                                >
                                                    <div className="h-px bg-gray-50 mb-6" />
                                                    <p className="text-muted-foreground font-light leading-relaxed text-lg tracking-wide">
                                                        {faq.answer}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="lg:col-span-4 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-black text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                                    <Zap className="w-24 h-24" />
                                </div>
                                
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-serif mb-2">Direct Intelligence</h2>
                                        <p className="text-white/60 font-light text-sm tracking-wide">Escalate your inquiry to our support squadron.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <a href="mailto:support@latebites.in" className="flex items-center gap-5 group/link">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/link:bg-primary transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-white/40">Secure Email</p>
                                                <p className="text-sm font-bold">support@latebites.in</p>
                                            </div>
                                        </a>

                                        <a href="tel:+911234567890" className="flex items-center gap-5 group/link">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/link:bg-primary transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-white/40">Dispatch Hotline</p>
                                                <p className="text-sm font-bold">+91 123 456 7890</p>
                                            </div>
                                        </a>

                                        <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 group/link">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/link:bg-primary transition-colors">
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-white/40">Instant Dispatch</p>
                                                <p className="text-sm font-bold">Start WhatsApp Chat</p>
                                            </div>
                                        </a>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/60">Agents Online: Mon-Sat</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Trust Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white rounded-[32px] border border-primary/5 p-8 flex items-center gap-6"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Encrypted Protection</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Privacy is our baseline protocol</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-10 border-t border-primary/5 bg-white/30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-serif text-sm">L</div>
                        <p className="text-[11px] uppercase tracking-[0.3em] font-black text-black">Latebites <span className="text-muted-foreground font-light ml-2">Manifesto 2024</span></p>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/orders" className="text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">Archive</Link>
                        <Link href="/profile" className="text-[10px] uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">Security Manual</Link>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 tracking-widest uppercase">Secured by Latebites Intelligence</p>
                </div>
            </footer>
        </div>
    );
}
