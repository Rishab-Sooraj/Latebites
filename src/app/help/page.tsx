"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, Phone, MessageCircle, Search, HelpCircle, Package, CreditCard, User as UserIcon, AlertCircle } from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                        backgroundSize: '40px 40px'
                    }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <HelpCircle className="w-8 h-8" />
                            <span className="text-sm uppercase tracking-widest font-semibold">
                                Support Center
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-serif italic mb-4">
                            How can we help you?
                        </h1>
                        <p className="text-xl text-purple-100 max-w-2xl mx-auto">
                            Find answers to common questions or get in touch with our support team
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl p-6 mb-12"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                        />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FAQ Section */}
                    <div className="lg:col-span-2">
                        {/* Category Filters */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-8"
                        >
                            <div className="flex flex-wrap gap-3">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === category
                                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                                : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* FAQ List */}
                        <div className="space-y-4">
                            {filteredFAQs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.05 }}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <span className="text-xs uppercase tracking-wider text-purple-600 font-semibold mb-2 block">
                                                {faq.category}
                                            </span>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ChevronDown className="w-6 h-6 text-gray-400" />
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
                                                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
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
                                className="text-center py-12"
                            >
                                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">
                                    No results found. Try a different search or category.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-2xl font-serif italic mb-6 text-gray-900">
                                Still need help?
                            </h2>

                            {/* Email Support */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            We'll respond within 24 hours
                                        </p>
                                        <a
                                            href="mailto:support@latebites.com"
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            support@latebites.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Phone Support */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <Phone className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Mon-Sat, 9 AM - 9 PM
                                        </p>
                                        <a
                                            href="tel:+911234567890"
                                            className="text-green-600 hover:underline font-medium"
                                        >
                                            +91 123 456 7890
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Support */}
                            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <MessageCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Chat with us instantly
                                        </p>
                                        <a
                                            href="https://wa.me/911234567890"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:underline font-medium"
                                        >
                                            Start Chat
                                        </a>
                                    </div>
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
                                className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center font-semibold"
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
