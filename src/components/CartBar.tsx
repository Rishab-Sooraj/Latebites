"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

export default function CartBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { items, restaurantName, totalItems, grandTotal, clearCart, isLoaded } = useCart();

    const hideOnPages = ['/cart', '/signup', '/auth', '/verify', '/verify-otp', '/'];
    const shouldHide = hideOnPages.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));

    if (!isLoaded || items.length === 0 || shouldHide) return null;

    // Short summary: "1× small · 1× medium"
    const bagSummary = items.map(i => `${i.quantity}× ${i.size}`).join(' · ');

    return (
        <AnimatePresence>
            <motion.div
                key="cartbar"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Subtle separator */}
                <div className="h-px bg-gray-100" />

                <div className="px-3 pt-2.5 pb-3">
                    <div className="bg-emerald-600 rounded-2xl flex items-center gap-2 px-3 py-2.5 shadow-lg shadow-emerald-700/20">

                        {/* Bag count pill */}
                        <div className="flex-shrink-0 bg-white/20 rounded-xl px-2.5 py-1.5 text-center min-w-[40px]">
                            <span className="text-white font-bold text-base leading-none">{totalItems}</span>
                            <span className="text-white/70 text-[9px] block leading-none mt-0.5">{totalItems === 1 ? 'bag' : 'bags'}</span>
                        </div>

                        {/* Bag summary text */}
                        <div className="flex-1 min-w-0 px-1">
                            <p className="text-white font-semibold text-[13px] leading-tight truncate">{bagSummary}</p>
                            <p className="text-white/60 text-[10px] leading-tight truncate">{restaurantName}</p>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right px-1">
                            <p className="text-white font-extrabold text-base leading-tight">₹{grandTotal}</p>
                        </div>

                        {/* Clear cart */}
                        <button
                            onClick={(e) => { e.stopPropagation(); clearCart(); }}
                            className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/15 active:bg-white/30 flex items-center justify-center"
                            aria-label="Clear cart"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        {/* Checkout button */}
                        <motion.button
                            onClick={() => router.push('/cart')}
                            whileTap={{ scale: 0.96 }}
                            className="flex-shrink-0 flex items-center gap-1 bg-white text-emerald-700 font-bold text-[13px] px-3.5 py-2.5 rounded-xl"
                        >
                            Checkout
                            <ChevronRight className="w-3.5 h-3.5" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
