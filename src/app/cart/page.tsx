"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, ShoppingBag, Clock, MapPin, Plus, Minus, Trash2,
    CreditCard, Wallet, CheckCircle2, Shield, Package, AlertTriangle,
    Timer, Leaf, Info, ChevronUp
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { createClient } from "@/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const cart = useCart();
    const supabase = createClient();

    const [paymentMethod, setPaymentMethod] = useState<'online' | 'pickup'>('pickup');
    const [processing, setProcessing] = useState(false);
    const [customer, setCustomer] = useState<any>(null);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [showSurplusInfo, setShowSurplusInfo] = useState(true);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [paymentFailed, setPaymentFailed] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    // Humorous payment failure messages
    const funnyFailMessages = [
        "Your payment just pulled a Houdini! 🎩✨ Now you see it, now you don't!",
        "Plot twist worthy of a Bollywood movie! The payment said 'Kal ho na ho' 🎬",
        "Error 404: Payment not found. It probably went to get chai. ☕",
        "The payment is buffering... still buffering... Jio ke network jaisa 📶",
        "Your payment went on a coffee break and forgot to come back ☕😴",
        "Transaction failed faster than my New Year resolutions! 🙃",
        "The payment ghosted us harder than your crush did 👻💔",
        "Money said 'Abhi nahi toh kabhi nahi' and chose kabhi nahi 🤷‍♂️",
        "The servers are doing yoga. Please wait while they find inner peace 🧘",
        "Payment went to the gym but skipped card-io day 💪😂",
    ];

    const getRandomFailMessage = () => {
        return funnyFailMessages[Math.floor(Math.random() * funnyFailMessages.length)];
    };

    // Load Razorpay SDK
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Check auth and fetch customer
    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('🛒 Cart: Checking auth...');
                const { data: { user } } = await supabase.auth.getUser();
                console.log('🛒 Cart: User:', user?.email || 'not logged in');

                if (user) {
                    // Try to get customer profile
                    const { data: customerData, error: customerError } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    console.log('🛒 Cart: Customer query result:', { customerData, customerError });

                    if (customerData) {
                        console.log('✅ Cart: Customer found:', customerData.name);
                        setCustomer(customerData);
                    } else {
                        // Profile doesn't exist - try to sync it using server API
                        console.log('⚠️ Cart: No customer profile found, syncing...');
                        try {
                            const syncRes = await fetch('/api/auth/sync-profile', { method: 'POST' });
                            const syncData = await syncRes.json();
                            if (syncData.customer) {
                                setCustomer(syncData.customer);
                                console.log('✅ Cart: Profile synced successfully!');
                            } else {
                                // Fallback to auth user data
                                console.log('⚠️ Cart: Using fallback user data');
                                setCustomer({
                                    id: user.id,
                                    email: user.email,
                                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
                                    phone: user.user_metadata?.phone || ''
                                });
                            }
                        } catch (syncErr) {
                            console.error('❌ Cart: Profile sync failed:', syncErr);
                            // Fallback to auth user data
                            setCustomer({
                                id: user.id,
                                email: user.email,
                                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Customer',
                                phone: user.user_metadata?.phone || ''
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Cart: Auth check error:', error);
            }
        };
        checkAuth();
    }, []);

    // Fetch restaurant details
    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!cart.restaurantId) return;
            try {
                const { data } = await supabase
                    .from('restaurants')
                    .select('id, name, address_line1, city, phone')
                    .eq('id', cart.restaurantId)
                    .single();
                setRestaurant(data);
            } catch (error) {
                console.error('Restaurant fetch error:', error);
            }
        };
        fetchRestaurant();
    }, [cart.restaurantId]);

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    };

    const calculateLockInTime = (pickupStart: string) => {
        if (!pickupStart) return '';
        const [hours, minutes] = pickupStart.split(':');
        let lockInMinutes = parseInt(hours) * 60 + parseInt(minutes) - 45;
        if (lockInMinutes < 0) lockInMinutes += 24 * 60;
        const lockInHours = Math.floor(lockInMinutes / 60);
        const lockInMins = lockInMinutes % 60;
        const period = lockInHours >= 12 ? 'PM' : 'AM';
        const hour12 = lockInHours % 12 || 12;
        return `${hour12}:${lockInMins.toString().padStart(2, '0')} ${period}`;
    };

    const handleCheckout = async () => {
        if (!customer) {
            toast.error('Please sign in to continue');
            router.push(`/signup?redirect=/cart`);
            return;
        }

        if (cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setProcessing(true);

        try {
            if (paymentMethod === 'pickup') {
                // Use server API for pay-at-pickup orders (bypasses RLS)
                const response = await fetch('/api/orders/pickup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.items.map(item => ({
                            bagId: item.bagId,
                            quantity: item.quantity,
                            restaurantId: item.restaurantId,
                            price: item.price,
                            pickupStart: item.pickupStart,
                            title: item.title,
                            restaurantName: item.restaurantName,
                        })),
                        customerId: customer.id,
                        customerEmail: customer.email,
                        customerName: customer.name,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to place order');
                }

                toast.success('Order placed successfully! 🎉');
                cart.clearCart();
                router.push('/orders');
            } else {
                const response = await fetch('/api/orders/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.items.map(item => ({
                            bagId: item.bagId,
                            quantity: item.quantity,
                        })),
                        customerId: customer.id,
                        totalAmount: cart.grandTotal,
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to create order');

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: data.razorpayOrder.amount,
                    currency: data.razorpayOrder.currency,
                    name: "Latebites",
                    description: `${cart.totalItems} Mystery Bag${cart.totalItems !== 1 ? 's' : ''}`,
                    order_id: data.razorpayOrder.id,
                    handler: async function (response: any) {
                        try {
                            const verifyResponse = await fetch('/api/orders/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderId: data.orderId,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature,
                                }),
                            });

                            if (verifyResponse.ok) {
                                toast.success('Payment successful! 🎉');
                                cart.clearCart();
                                router.push('/orders');
                            } else {
                                const errData = await verifyResponse.json();
                                toast.error(errData.error || 'Payment verification failed');
                                // Cancel the pending order
                                await fetch('/api/orders/cancel', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: data.orderId, reason: 'Payment verification failed' }),
                                });
                            }
                        } catch (err) {
                            console.error('Verification error:', err);
                            toast.error('Payment verification failed. Please contact support.');
                        }
                        setProcessing(false);
                    },
                    prefill: {
                        name: customer.name,
                        email: customer.email || '',
                        contact: customer.phone,
                    },
                    theme: { color: "#059669" },
                    modal: {
                        ondismiss: async function () {
                            console.log('Payment modal dismissed');
                            setPaymentFailed({ show: true, message: getRandomFailMessage() });
                            setProcessing(false);
                            // Cancel the pending order since user dismissed
                            try {
                                await fetch('/api/orders/cancel', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: data.orderId, reason: 'User cancelled payment' }),
                                });

                                // Send reminder email
                                await fetch('/api/orders/payment-failed', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        customerEmail: customer?.email,
                                        customerName: customer?.name,
                                        orderId: data.orderId,
                                        reason: 'User cancelled payment',
                                    }),
                                });
                            } catch (err) {
                                console.error('Failed to cancel order:', err);
                            }
                        },
                        escape: true,
                        animation: true,
                    },
                };

                const rzp = new window.Razorpay(options);

                // Handle payment failure
                rzp.on('payment.failed', async function (response: any) {
                    console.error('Payment failed:', response.error);
                    setPaymentFailed({ show: true, message: getRandomFailMessage() });
                    setProcessing(false);
                    // Cancel the pending order
                    try {
                        await fetch('/api/orders/cancel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: data.orderId,
                                reason: response.error.description || 'Payment failed'
                            }),
                        });

                        // Send payment failure email
                        await fetch('/api/orders/payment-failed', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customerEmail: customer?.email,
                                customerName: customer?.name,
                                orderId: data.orderId,
                                reason: response.error.description || 'Payment failed',
                            }),
                        });
                    } catch (err) {
                        console.error('Failed to cancel order:', err);
                    }
                });

                rzp.open();
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Checkout failed');
            setProcessing(false);
        }
    };

    const earliestLockIn = cart.items.length > 0
        ? calculateLockInTime(cart.items[0].pickupStart)
        : '';

    if (!cart.isLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Toaster position="top-center" />

                <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                    <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8">Add some mystery bags to get started!</p>
                        <button
                            onClick={() => router.push('/browse')}
                            className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
                        >
                            Browse Restaurants
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Toaster position="top-center" />

            {/* Payment Failed Overlay */}
            <AnimatePresence>
                {paymentFailed.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setPaymentFailed({ show: false, message: '' })}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sad emoji animation */}
                            <motion.div
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-7xl mb-4"
                            >
                                😅
                            </motion.div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Payment Didn't Go Through
                            </h2>

                            <p className="text-lg text-gray-600 mb-6">
                                {paymentFailed.message}
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setPaymentFailed({ show: false, message: '' });
                                        // Reset and try again
                                    }}
                                    className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25"
                                >
                                    Try Again 💪
                                </button>
                                <button
                                    onClick={() => {
                                        setPaymentFailed({ show: false, message: '' });
                                        setPaymentMethod('pickup');
                                    }}
                                    className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Pay at Pickup Instead
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mt-4">
                                Don't worry, your mystery bag is still waiting! 🍔
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Surplus Info Overlay */}
            <AnimatePresence>
                {showSurplusInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowSurplusInfo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Leaf className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Saving Surplus Food</h2>
                                        <p className="text-white/80 text-sm">Be a food rescue hero! 🦸</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Info className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">What's in the bag?</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Perfectly good surplus food from restaurants. It's a mystery - you won't know exactly what's inside until pickup!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Timer className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Lock-in Period</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Orders lock-in <span className="font-bold text-red-600">45 minutes before pickup</span>.
                                            Before then, items may be removed if restaurants run out of surplus.
                                        </p>
                                        {earliestLockIn && (
                                            <p className="text-sm text-red-600 font-medium mt-2">
                                                ⏰ Your order locks at {earliestLockIn}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Reduce Food Waste</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Each bag you save prevents good food from going to waste. Plus, you get great food at amazing prices!
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSurplusInfo(false)}
                                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition mt-4"
                                >
                                    Got it, let's checkout! 🎉
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                        {restaurant && (
                            <p className="text-sm text-gray-500">{restaurant.name}</p>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Lock-in Warning Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800 font-medium">
                                Items may become unavailable until lock-in
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Your order locks at {earliestLockIn} (45 min before pickup)
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Restaurant Info */}
                {restaurant && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                <Package className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {restaurant.address_line1}, {restaurant.city}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Cart Items */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                >
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {cart.items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md capitalize">
                                                {item.size}
                                            </span>
                                            {item.dietaryInfo?.[0] && (
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${item.dietaryInfo[0] === 'veg'
                                                    ? 'bg-green-100 text-green-700'
                                                    : item.dietaryInfo[0] === 'non-veg'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {item.dietaryInfo[0]}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatTime(item.pickupStart)} - {formatTime(item.pickupEnd)}
                                        </p>
                                        <p className="font-bold text-gray-900 mt-2">₹{item.price * item.quantity}</p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            onClick={() => cart.removeFromCart(item.bagId)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1 bg-emerald-600 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => cart.updateQuantity(item.bagId, item.quantity - 1)}
                                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-emerald-700 transition"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-6 text-center text-white font-bold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => cart.updateQuantity(item.bagId, item.quantity + 1)}
                                                disabled={item.quantity >= item.maxQuantity}
                                                className="w-8 h-8 flex items-center justify-center text-white hover:bg-emerald-700 transition disabled:opacity-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Bill Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Bill Summary</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Item Total ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})</span>
                            <span>₹{cart.totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span className="flex items-center gap-1">
                                Platform Fee
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                            <span>₹{cart.platformFee}</span>
                        </div>
                        <div className="h-px bg-gray-100 my-3" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Grand Total</span>
                            <span className="text-emerald-600">₹{cart.grandTotal}</span>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <Leaf className="w-5 h-5" />
                            <span className="font-medium">You're saving food from going to waste! 🌱</span>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Sticky Payment Bar - Swiggy Style */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
                {/* Payment Options Panel */}
                <AnimatePresence>
                    {showPaymentOptions && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-gray-100"
                        >
                            <div className="max-w-3xl mx-auto p-4 space-y-3">
                                <button
                                    onClick={() => {
                                        setPaymentMethod('pickup');
                                        setShowPaymentOptions(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'pickup'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'pickup' ? 'bg-emerald-100' : 'bg-gray-100'
                                        }`}>
                                        <Wallet className={`w-6 h-6 ${paymentMethod === 'pickup' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">Pay at Pickup</p>
                                        <p className="text-sm text-gray-500">Cash or UPI at restaurant</p>
                                    </div>
                                    {paymentMethod === 'pickup' && (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setPaymentMethod('online');
                                        setShowPaymentOptions(false);
                                    }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'online'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'online' ? 'bg-emerald-100' : 'bg-gray-100'
                                        }`}>
                                        <CreditCard className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">Pay Online</p>
                                        <p className="text-sm text-gray-500">UPI, Cards, Net Banking</p>
                                    </div>
                                    {paymentMethod === 'online' && (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Bar */}
                <div className="max-w-3xl mx-auto flex items-center justify-between p-4 gap-4">
                    {/* Payment Method Selector */}
                    <button
                        onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                        className="flex items-center gap-3 flex-1"
                    >
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            {paymentMethod === 'pickup' ? (
                                <Wallet className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                            )}
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">PAY USING</span>
                                <ChevronUp className="w-3 h-3 text-gray-400" />
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">
                                {paymentMethod === 'pickup' ? 'Pay at Pickup (Cash/UPI)' : 'Pay Online'}
                            </p>
                        </div>
                    </button>

                    {/* Pay Button */}
                    {!customer ? (
                        <button
                            onClick={() => router.push(`/signup?redirect=/cart`)}
                            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25"
                        >
                            Sign In
                        </button>
                    ) : (
                        <motion.button
                            onClick={handleCheckout}
                            disabled={processing}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Pay ₹{cart.grandTotal}</>
                            )}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
