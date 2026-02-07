"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

export default function CartBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { items, restaurantName, totalItems, grandTotal, clearCart, isLoaded } = useCart();

    // Don't show on checkout, signup, auth pages, or landing page
    const hideOnPages = ['/cart', '/signup', '/auth', '/verify', '/verify-otp', '/'];
    const shouldHide = hideOnPages.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));

    // Don't render until cart is loaded from localStorage
    if (!isLoaded || items.length === 0 || shouldHide) return null;

    const handleCheckout = () => {
        router.push('/cart');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white to-white/95"
            >
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-600/30 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4">
                            {/* Left side - Restaurant info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white/80 text-xs font-medium truncate">
                                        {restaurantName}
                                    </p>
                                    <p className="text-white font-bold text-lg">
                                        {totalItems} item{totalItems !== 1 ? 's' : ''} | ₹{grandTotal}
                                    </p>
                                </div>
                            </div>

                            {/* Right side - Actions */}
                            <div className="flex items-center gap-2">
                                {/* Clear cart button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearCart();
                                    }}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white/80" />
                                </button>

                                {/* Checkout button */}
                                <motion.button
                                    onClick={handleCheckout}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-bold rounded-xl shadow-lg cursor-pointer"
                                >
                                    <span>Checkout</span>
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Items preview strip */}
                        <div className="px-4 pb-3">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex-shrink-0 px-3 py-1.5 bg-white/15 rounded-lg"
                                    >
                                        <span className="text-white/90 text-xs font-medium">
                                            {item.quantity}x {item.size}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
