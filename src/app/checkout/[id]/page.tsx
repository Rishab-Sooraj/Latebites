"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Clock, MapPin, CreditCard, Wallet, CheckCircle2 } from "lucide-react";

interface BagData {
    id: string;
    restaurant_id: string;
    title: string;
    description: string | null;
    size: string;
    discounted_price: number;
    quantity_available: number;
    pickup_start_time: string;
    pickup_end_time: string;
}

interface RestaurantData {
    id: string;
    name: string;
    address_line1: string;
    city: string;
}

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();

    const [bag, setBag] = useState<BagData | null>(null);
    const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'pickup'>('pickup');
    const [processing, setProcessing] = useState(false);

    const platformFee = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching bag:', params.id);

                // Fetch bag via API to avoid RLS issues
                const res = await fetch(`/api/bag/${params.id}`);

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to fetch bag');
                }

                const data = await res.json();
                console.log('Bag data:', data);

                setBag(data.bag);
                setRestaurant(data.restaurant);
            } catch (err: any) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    const totalAmount = bag ? (bag.discounted_price * quantity) + platformFee : 0;

    const handleCheckout = async () => {
        if (!bag) return;

        setProcessing(true);

        // For now, simulate order creation
        setTimeout(() => {
            alert(`Order placed! Total: ₹${totalAmount}\nPayment: ${paymentMethod === 'pickup' ? 'Pay at Pickup' : 'Online'}`);
            setProcessing(false);
            router.push('/browse');
        }, 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading checkout...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => router.push('/browse')}
                    className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700"
                >
                    ← Back to browse
                </button>
            </div>
        );
    }

    if (!bag || !restaurant) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Bag not found</h1>
                <button
                    onClick={() => router.push('/browse')}
                    className="mt-4 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700"
                >
                    ← Back to browse
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Order Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                    <div className="flex gap-4">
                        <img
                            src="/images/hero-indian-food.png"
                            alt={bag.title}
                            className="w-24 h-24 object-cover rounded-xl"
                        />
                        <div>
                            <h3 className="font-bold text-gray-900">{bag.title}</h3>
                            <p className="text-sm text-gray-500">{restaurant.name}</p>
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{restaurant.address_line1}, {restaurant.city}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>Pickup: {bag.pickup_start_time.slice(0, 5)} - {bag.pickup_end_time.slice(0, 5)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-gray-600">Quantity</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                            >-</button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(bag.quantity_available, quantity + 1))}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>

                    <div className="space-y-3">
                        <button
                            onClick={() => setPaymentMethod('pickup')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'pickup' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                                }`}
                        >
                            <Wallet className={`w-6 h-6 ${paymentMethod === 'pickup' ? 'text-emerald-600' : 'text-gray-400'}`} />
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900">Pay at Pickup</div>
                                <div className="text-sm text-gray-500">Cash or UPI at restaurant</div>
                            </div>
                            {paymentMethod === 'pickup' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                        </button>

                        <button
                            onClick={() => setPaymentMethod('online')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'online' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                                }`}
                        >
                            <CreditCard className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-emerald-600' : 'text-gray-400'}`} />
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-gray-900">Pay Online</div>
                                <div className="text-sm text-gray-500">UPI, Cards, Net Banking</div>
                            </div>
                            {paymentMethod === 'online' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                        </button>
                    </div>
                </div>

                {/* Price Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Price Details</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Bag Price ({quantity}x)</span>
                            <span>₹{bag.discounted_price * quantity}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Platform Fee</span>
                            <span>₹{platformFee}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-100 font-bold text-lg">
                            <span>Total</span>
                            <span className="text-emerald-600">₹{totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Checkout Button */}
                <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                    {processing ? 'Processing...' : `Pay ₹${totalAmount}`}
                </button>
            </main>
        </div>
    );
}
