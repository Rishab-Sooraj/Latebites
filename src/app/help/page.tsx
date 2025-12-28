"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Phone, MessageCircle, Search, HelpCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqs: FAQItem[] = [
    {
        category: "Orders & Payments",
        question: "How do I place an order for a rescue bag?",
        answer: "Browse available rescue bags in the 'Browse' section, select the bag you want, and proceed to checkout. You'll receive a confirmation with pickup details once your order is confirmed.",
    },
    {
        category: "Orders & Payments",
        question: "What payment methods do you accept?",
        answer: "We accept all major credit/debit cards, UPI, and digital wallets. All payments are processed securely through our payment gateway.",
    },
    {
        category: "Rescue Bags",
        question: "What is a rescue bag?",
        answer: "A rescue bag is surplus food from restaurants that would otherwise go to waste. You get quality food at a discounted price while helping reduce food waste!",
    },
    {
        category: "Rescue Bags",
        question: "When can I pick up my rescue bag?",
        answer: "Pickup times vary by restaurant. You'll see the available pickup window when browsing bags. Most pickups are during closing hours (8-10 PM).",
    },
    {
        category: "Refunds & Cancellations",
        question: "Can I cancel my order?",
        answer: "You can cancel your order up to 2 hours before the pickup time for a full refund. After that, cancellations may not be eligible for refunds.",
    },
    {
        category: "Refunds & Cancellations",
        question: "How long do refunds take?",
        answer: "Refunds are processed within 5-7 business days and will be credited to your original payment method.",
    },
    {
        category: "Account & Profile",
        question: "How do I update my profile information?",
        answer: "Go to 'My Profile' from your dashboard to update your name, phone number, and other account details.",
    },
    {
        category: "Technical Issues",
        question: "The app is not working properly. What should I do?",
        answer: "Try refreshing the page or clearing your browser cache. If the issue persists, contact our support team with details about the problem.",
    },
];

const categories = ["All", "Orders & Payments", "Rescue Bags", "Refunds & Cancellations", "Account & Profile", "Technical Issues"];

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
        <div className="min-h-screen bg-background">
            {/* Hero Section - Minimalist */}
            <section className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <HelpCircle className="w-6 h-6 mx-auto mb-6 text-muted-foreground" />
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light leading-tight mb-6">
                            How can we help you?
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                            Find answers to common questions or get in touch with our support team
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                {/* Search Bar - Minimal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto mb-16"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border border-border focus:outline-none focus:border-foreground/20 transition-colors bg-background text-foreground"
                        />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* FAQ Section */}
                    <div className="lg:col-span-2">
                        {/* Category Filters - Minimal */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-12"
                        >
                            <div className="flex flex-wrap gap-3">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${selectedCategory === category
                                                ? "bg-foreground text-background"
                                                : "border border-border hover:border-foreground/20"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* FAQ List - Minimal */}
                        <div className="space-y-6">
                            {filteredFAQs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.05 }}
                                    className="border-b border-border"
                                >
                                    <button
                                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                                        className="w-full py-6 text-left flex items-start justify-between gap-4 hover:opacity-70 transition-opacity"
                                    >
                                        <div className="flex-1">
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                                                {faq.category}
                                            </p>
                                            <h3 className="text-lg md:text-xl font-serif font-light">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedFAQ === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pb-6 text-muted-foreground font-light leading-relaxed">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>

                        {filteredFAQs.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16"
                            >
                                <p className="text-muted-foreground font-light">
                                    No results found. Try a different search or category.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Contact Section - Minimal */}
                    <div className="space-y-12">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-2xl md:text-3xl font-serif font-light mb-8">
                                Still need help?
                            </h2>

                            <div className="space-y-8">
                                {/* Email Support */}
                                <div className="border-b border-border pb-6">
                                    <Mail className="w-5 h-5 text-muted-foreground mb-3" />
                                    <h3 className="text-lg font-serif font-light mb-2">Email Us</h3>
                                    <p className="text-sm text-muted-foreground font-light mb-3">
                                        We'll respond within 24 hours
                                    </p>
                                    <a
                                        href="mailto:support@latebites.com"
                                        className="text-sm hover:opacity-70 transition-opacity"
                                    >
                                        support@latebites.com
                                    </a>
                                </div>

                                {/* Phone Support */}
                                <div className="border-b border-border pb-6">
                                    <Phone className="w-5 h-5 text-muted-foreground mb-3" />
                                    <h3 className="text-lg font-serif font-light mb-2">Call Us</h3>
                                    <p className="text-sm text-muted-foreground font-light mb-3">
                                        Mon-Sat, 9 AM - 9 PM
                                    </p>
                                    <a
                                        href="tel:+911234567890"
                                        className="text-sm hover:opacity-70 transition-opacity"
                                    >
                                        +91 123 456 7890
                                    </a>
                                </div>

                                {/* WhatsApp Support */}
                                <div className="pb-6">
                                    <MessageCircle className="w-5 h-5 text-muted-foreground mb-3" />
                                    <h3 className="text-lg font-serif font-light mb-2">WhatsApp</h3>
                                    <p className="text-sm text-muted-foreground font-light mb-3">
                                        Chat with us instantly
                                    </p>
                                    <a
                                        href="https://wa.me/911234567890"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm hover:opacity-70 transition-opacity"
                                    >
                                        Start Chat →
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* Back to Dashboard */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Link
                                href="/customer/dashboard"
                                className="block border border-border hover:border-foreground/20 transition-colors p-6 text-center text-sm uppercase tracking-[0.2em]"
                            >
                                ← Back to Dashboard
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
