"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

export default function CartBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { items, restaurantName, totalItems, grandTotal, clearCart, isLoaded } = useCart();

    const hideOnPages = ['/cart', '/signup', '/auth', '/verify', '/verify-otp', '/'];
    const shouldHide = hideOnPages.some(page => pathname === page || (page !== '/' && pathname?.startsWith(page)));

    if (!isLoaded || items.length === 0 || shouldHide) return null;

    const itemsSummary = items.map(i => `${i.quantity}× ${i.size}`).join('  ·  ');

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Fade from white behind */}
                <div className="h-3 bg-gradient-to-t from-white to-transparent" />

                <div className="bg-white px-3 pt-2 pb-3">
                    <div className="bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center px-3 py-2.5 gap-3">

                        {/* Icon */}
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>

                        {/* Info — restaurant + items summary */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-white/70 uppercase tracking-widest truncate leading-none mb-0.5">
                                {restaurantName}
                            </p>
                            <p className="text-[13px] font-bold text-white leading-none truncate">
                                {itemsSummary}
                            </p>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right mr-1">
                            <p className="text-[11px] text-white/60 font-medium leading-none mb-0.5">Total</p>
                            <p className="text-[15px] font-extrabold text-white leading-none">₹{grandTotal}</p>
                        </div>

                        {/* Clear */}
                        <button
                            onClick={(e) => { e.stopPropagation(); clearCart(); }}
                            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                            aria-label="Clear cart"
                        >
                            <X className="w-4 h-4 text-white/80" />
                        </button>

                        {/* Checkout CTA */}
                        <motion.button
                            onClick={() => router.push('/cart')}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-emerald-700 font-extrabold text-[13px] px-4 py-2.5 rounded-xl shadow-md"
                        >
                            Checkout
                            <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
