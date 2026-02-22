"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, Search, User, Store, RotateCcw, X, Loader2,
    AlertTriangle, CheckCircle, IndianRupee, CreditCard, XCircle, Ban
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Order {
    id: string;
    bag_title: string;
    restaurant_name: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    status: string;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    razorpay_payment_id: string | null;
    refund_status: string | null;
    refund_amount: number | null;
    created_at: string;
    pickup_time: string;
}

export default function OrdersPage() {
    const supabase = createClient();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Refund modal state
    const [refundModal, setRefundModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [refundReason, setRefundReason] = useState("");
    const [refundAmount, setRefundAmount] = useState<number | null>(null);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundResult, setRefundResult] = useState<{ success: boolean; message: string } | null>(null);

    // Cancel modal state
    const [cancelModal, setCancelModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });
    const [cancelReason, setCancelReason] = useState("");
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string; eligibleForRefund?: boolean } | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'confirmed': return 'bg-blue-500/10 text-blue-500';
            case 'picked_up':
            case 'completed': return 'bg-emerald-500/10 text-emerald-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            case 'refunded': return 'bg-purple-500/10 text-purple-500';
            default: return 'bg-zinc-500/10 text-zinc-500';
        }
    };

    const getRefundStatusBadge = (order: Order) => {
        if (!order.refund_status || order.refund_status === 'none') return null;
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-500',
            partial: 'bg-orange-500/10 text-orange-500',
            full: 'bg-purple-500/10 text-purple-500',
            failed: 'bg-red-500/10 text-red-500',
        };
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[order.refund_status] || 'bg-zinc-500/10 text-zinc-500'}`}>
                {order.refund_status === 'full' ? 'REFUNDED' :
                    order.refund_status === 'partial' ? `PARTIAL ₹${order.refund_amount}` :
                        order.refund_status.toUpperCase()}
            </span>
        );
    };

    const canRefund = (order: Order) =>
        order.payment_method === 'online' &&
        order.payment_status === 'paid' &&
        order.refund_status !== 'full';

    // Cancellable = pending or confirmed (not already done/cancelled)
    const canCancel = (order: Order) =>
        !['cancelled', 'completed', 'picked_up'].includes(order.status);

    // --- Refund handlers ---
    const openRefundModal = (order: Order) => {
        setRefundModal({ open: true, order });
        setRefundReason("");
        setRefundAmount(null);
        setRefundResult(null);
    };
    const closeRefundModal = () => {
        setRefundModal({ open: false, order: null });
        setRefundReason(""); setRefundAmount(null); setRefundResult(null);
    };

    const handleRefund = async () => {
        if (!refundModal.order) return;
        setRefundLoading(true);
        setRefundResult(null);
        try {
            const adminId = localStorage.getItem('adminId');
            const response = await fetch('/api/orders/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: refundModal.order.id,
                    reason: refundReason || 'Refund requested by admin',
                    amount: refundAmount,
                    adminId,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to process refund');
            setRefundResult({ success: true, message: data.message || `Refund of ₹${data.refund?.amount} processed successfully!` });
            fetchOrders();
        } catch (error: any) {
            setRefundResult({ success: false, message: error.message || 'Failed to process refund' });
        } finally {
            setRefundLoading(false);
        }
    };

    // --- Cancel handlers ---
    const openCancelModal = (order: Order) => {
        setCancelModal({ open: true, order });
        setCancelReason("");
        setCancelResult(null);
    };
    const closeCancelModal = () => {
        setCancelModal({ open: false, order: null });
        setCancelReason(""); setCancelResult(null);
    };

    const handleCancelOrder = async () => {
        if (!cancelModal.order) return;
        if (!cancelReason.trim()) return; // enforced by UI disabled state

        setCancelLoading(true);
        setCancelResult(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('Session expired. Please log in again.');

            const response = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: cancelModal.order.id,
                    reason: cancelReason.trim(),
                    adminEmail: user.email,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to cancel order');
            setCancelResult({
                success: true,
                message: data.message || 'Order cancelled successfully.',
                eligibleForRefund: data.eligibleForRefund,
            });
            fetchOrders();
        } catch (error: any) {
            setCancelResult({ success: false, message: error.message || 'Failed to cancel order' });
        } finally {
            setCancelLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q ||
            order.id?.toLowerCase().includes(q) ||
            order.id?.substring(0, 8).toLowerCase().includes(q) ||
            order.bag_title?.toLowerCase().includes(q) ||
            order.restaurant_name?.toLowerCase().includes(q) ||
            order.customer_name?.toLowerCase().includes(q) ||
            order.customer_email?.toLowerCase().includes(q) ||
            order.customer_phone?.includes(q);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const completedCount = orders.filter(o => ['picked_up', 'completed'].includes(o.status)).length;
    const refundedCount = orders.filter(o => o.refund_status === 'full').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif text-white">Orders</h1>
                <p className="text-zinc-500 mt-1">Track and manage all customer orders</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Total</p>
                    <p className="text-3xl font-semibold text-white mt-1">{totalCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-500 text-sm">Pending</p>
                    <p className="text-3xl font-semibold text-white mt-1">{pendingCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-500 text-sm">Completed</p>
                    <p className="text-3xl font-semibold text-white mt-1">{completedCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-purple-500 text-sm">Refunded</p>
                    <p className="text-3xl font-semibold text-white mt-1">{refundedCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-500 text-sm">Cancelled</p>
                    <p className="text-3xl font-semibold text-white mt-1">{cancelledCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by customer, restaurant, or bag..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                </select>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-pulse">
                            <div className="h-6 w-1/3 bg-zinc-800 rounded mb-4" />
                            <div className="h-4 w-1/2 bg-zinc-800 rounded mb-2" />
                            <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="space-y-4">
                    {filteredOrders.map((order, index) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{order.bag_title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                                        <div className="flex items-center gap-2">
                                            <Store className="w-4 h-4" />
                                            <span>{order.restaurant_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>{order.customer_name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getRefundStatusBadge(order)}
                                    <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div>
                                    <span className="block text-zinc-500 mb-1">Amount</span>
                                    <span className="text-white font-medium text-lg">₹{order.total_amount}</span>
                                </div>
                                <div>
                                    <span className="block text-zinc-500 mb-1">Payment</span>
                                    <div className="flex items-center gap-1">
                                        <CreditCard className="w-3 h-3 text-zinc-400" />
                                        <span className="text-white capitalize">{order.payment_method || 'N/A'}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-zinc-500 mb-1">Customer Phone</span>
                                    <span className="text-white">{order.customer_phone}</span>
                                </div>
                                <div>
                                    <span className="block text-zinc-500 mb-1">Order Date</span>
                                    <span className="text-white">{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="block text-zinc-500 mb-1">Order Time</span>
                                    <span className="text-white">{new Date(order.created_at).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {(canRefund(order) || canCancel(order)) && (
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3 flex-wrap">
                                    {canCancel(order) && (
                                        <button
                                            onClick={() => openCancelModal(order)}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                                        >
                                            <Ban className="w-4 h-4" />
                                            <span>Cancel Order</span>
                                        </button>
                                    )}
                                    {canRefund(order) && (
                                        <button
                                            onClick={() => openRefundModal(order)}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Process Refund</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
                    <p className="text-zinc-500">
                        {searchQuery || statusFilter !== "all"
                            ? 'Try adjusting your filters'
                            : 'Orders will appear here when customers make purchases'}
                    </p>
                </div>
            )}

            {/* ───── Cancel Order Modal ───── */}
            <AnimatePresence>
                {cancelModal.open && cancelModal.order && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeCancelModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Cancel Order</h2>
                                        <p className="text-sm text-zinc-500">Order #{cancelModal.order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={closeCancelModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {cancelResult ? (
                                    <div className={`p-4 rounded-xl ${cancelResult.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                        <div className="flex items-start gap-3">
                                            {cancelResult.success
                                                ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                            <div>
                                                <h4 className={`font-medium ${cancelResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {cancelResult.success ? 'Order Cancelled' : 'Cancellation Failed'}
                                                </h4>
                                                <p className="text-sm text-zinc-400 mt-1">{cancelResult.message}</p>
                                            </div>
                                        </div>
                                        {/* Prompt to refund if eligible */}
                                        {cancelResult.success && cancelResult.eligibleForRefund && (
                                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <p className="text-amber-400 text-xs font-medium">💳 This order was paid online. Consider processing a refund from the order card.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Order summary */}
                                        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Customer</span>
                                                <span className="text-white">{cancelModal.order.customer_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Bag</span>
                                                <span className="text-white">{cancelModal.order.bag_title}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">Restaurant</span>
                                                <span className="text-white">{cancelModal.order.restaurant_name}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-zinc-700">
                                                <span className="text-zinc-400 font-medium">Amount</span>
                                                <span className="text-white font-semibold">₹{cancelModal.order.total_amount}</span>
                                            </div>
                                        </div>

                                        {/* Mandatory reason */}
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Cancellation Reason <span className="text-red-400">*</span>
                                            </label>
                                            <textarea
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                placeholder="Enter reason for cancellation (required)..."
                                                rows={3}
                                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                                            />
                                            {cancelReason.trim() === '' && (
                                                <p className="text-red-400 text-xs mt-1">A reason is required to cancel an order.</p>
                                            )}
                                        </div>

                                        {/* Refund note for online payments */}
                                        {cancelModal.order.payment_method === 'online' && cancelModal.order.payment_status === 'paid' && (
                                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-400">
                                                    This order was paid online (₹{cancelModal.order.total_amount}). After cancellation, use the <strong>Process Refund</strong> button to initiate the customer refund.
                                                </p>
                                            </div>
                                        )}

                                        {/* Warning */}
                                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-400">
                                                This will cancel the order and restore the bag's available quantity. This action cannot be undone.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
                                {cancelResult ? (
                                    <button onClick={closeCancelModal} className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors">
                                        Close
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={closeCancelModal} className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors">
                                            Go Back
                                        </button>
                                        <button
                                            onClick={handleCancelOrder}
                                            disabled={cancelLoading || !cancelReason.trim()}
                                            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {cancelLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</> : <><XCircle className="w-4 h-4" /> Confirm Cancel</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ───── Refund Modal ───── */}
            <AnimatePresence>
                {refundModal.open && refundModal.order && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeRefundModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                                        <RotateCcw className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Process Refund</h2>
                                        <p className="text-sm text-zinc-500">Order #{refundModal.order.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <button onClick={closeRefundModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors">
                                    <X className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {refundResult ? (
                                    <div className={`p-4 rounded-lg ${refundResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                        <div className="flex items-start gap-3">
                                            {refundResult.success
                                                ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                            <div>
                                                <h4 className={`font-medium ${refundResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {refundResult.success ? 'Refund Successful' : 'Refund Failed'}
                                                </h4>
                                                <p className="text-sm text-zinc-400 mt-1">{refundResult.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-zinc-800/50 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-zinc-400 mb-3">Order Details</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Customer</span>
                                                    <span className="text-white">{refundModal.order.customer_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Bag</span>
                                                    <span className="text-white">{refundModal.order.bag_title}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Order Total</span>
                                                    <span className="text-white font-medium">₹{refundModal.order.total_amount}</span>
                                                </div>
                                                {refundModal.order.refund_amount && refundModal.order.refund_amount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-zinc-500">Already Refunded</span>
                                                        <span className="text-orange-400">-₹{refundModal.order.refund_amount}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between pt-2 border-t border-zinc-700">
                                                    <span className="text-zinc-400 font-medium">Refundable Amount</span>
                                                    <span className="text-emerald-400 font-semibold">
                                                        ₹{refundModal.order.total_amount - (refundModal.order.refund_amount || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Refund Amount (optional)</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <input
                                                    type="number"
                                                    value={refundAmount || ''}
                                                    onChange={(e) => setRefundAmount(e.target.value ? parseFloat(e.target.value) : null)}
                                                    placeholder={`Full refund: ₹${refundModal.order.total_amount - (refundModal.order.refund_amount || 0)}`}
                                                    max={refundModal.order.total_amount - (refundModal.order.refund_amount || 0)}
                                                    className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">Leave empty for full refund</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Reason for Refund</label>
                                            <textarea
                                                value={refundReason}
                                                onChange={(e) => setRefundReason(e.target.value)}
                                                placeholder="Enter refund reason..."
                                                rows={3}
                                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                            />
                                        </div>

                                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-400">
                                                The refund will be credited to the customer's original payment method within 5–7 business days. This action cannot be undone.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
                                {refundResult ? (
                                    <button onClick={closeRefundModal} className="px-6 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">Close</button>
                                ) : (
                                    <>
                                        <button onClick={closeRefundModal} className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors">Cancel</button>
                                        <button
                                            onClick={handleRefund}
                                            disabled={refundLoading}
                                            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {refundLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <><RotateCcw className="w-4 h-4" />Process Refund</>}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
