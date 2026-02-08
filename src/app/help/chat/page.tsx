"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Message {
    id: string;
    conversation_id: string;
    sender_type: 'customer' | 'admin';
    sender_id: string;
    message: string;
    read_by_recipient: boolean;
    created_at: string;
}

interface Conversation {
    id: string;
    order_id: string | null;
    issue_type: string;
    status: string;
    assigned_admin_id: string | null;
    created_at: string;
}

interface Admin {
    id: string;
    name: string;
    email: string;
}

interface Order {
    id: string;
    restaurant: {
        name: string;
    };
    rescue_bag: {
        name: string;
    };
    total_price: number;
}

const issueLabels: Record<string, string> = {
    'value_not_met': "Bag didn't meet expected value",
    'quality_issue': 'Food quality/freshness issue',
    'missing_items': 'Missing items from bag',
    'wrong_order': 'Received wrong order',
    'pickup_issue': 'Pickup location/timing problem',
    'other': 'General Support',
};

function ChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { customer } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [assignedAdmin, setAssignedAdmin] = useState<Admin | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isInitializingRef = useRef(false); // Prevent duplicate initialization
    const supabase = createClient();

    const orderId = searchParams.get('order'); // Can be null for general support
    const issueType = searchParams.get('issue') || 'other';

    useEffect(() => {
        if (!customer) {
            router.push('/help');
            return;
        }

        if (!issueType) {
            router.push('/help');
            return;
        }

        initializeChat();
    }, [customer, orderId, issueType]);

    useEffect(() => {
        if (!conversation?.id) return;

        const unsubscribe = subscribeToMessages();
        startPolling(conversation.id);

        return () => {
            stopPolling();
            if (unsubscribe) unsubscribe();
        };
    }, [conversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const startPolling = (conversationId: string) => {
        stopPolling();
        pollingRef.current = setInterval(() => {
            fetchMessages(conversationId);
            fetchConversationUpdates(conversationId); // Check for admin assignment
        }, 5000);
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const fetchConversationUpdates = async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('support_conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (!error && data) {
                const conv = data as Conversation;
                setConversation(conv);

                // Fetch admin if newly assigned
                if (conv.assigned_admin_id && !assignedAdmin) {
                    await fetchAssignedAdmin(conv.assigned_admin_id);
                }
            }
        } catch (err) {
            console.error('Error fetching conversation updates:', err);
        }
    };

    const initializeChat = async () => {
        // Prevent duplicate initialization
        if (isInitializingRef.current) {
            console.log('⏳ Chat already initializing, skipping...');
            return;
        }
        isInitializingRef.current = true;

        try {
            // Fetch order details if orderId is provided
            if (orderId) {
                const { data, error: orderError } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        restaurant:restaurants(name),
                        rescue_bag:rescue_bags(name),
                        total_price
                    `)
                    .eq('id', orderId)
                    .single();

                if (!orderError && data) {
                    setOrder(data as any);
                }
            }

            // Use API endpoint to atomically get or create conversation
            // This prevents race conditions and duplicates
            console.log('🔄 Calling get-or-create-conversation API...');
            const response = await fetch('/api/support/get-or-create-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customer?.id,
                    orderId: orderId || null,
                    issueType: issueType,
                    customerName: customer?.name,
                }),
            });

            const result = await response.json();

            if (result.error) {
                console.error('❌ API error:', result.error);
                throw new Error(result.error);
            }

            if (result.conversation) {
                console.log(`✅ Got conversation (isNew: ${result.isNew}):`, result.conversation.id);
                setConversation(result.conversation as Conversation);

                // Fetch admin info if assigned
                if (result.conversation.assigned_admin_id) {
                    await fetchAssignedAdmin(result.conversation.assigned_admin_id);
                }

                await fetchMessages(result.conversation.id);
            }
        } catch (error) {
            console.error('Error initializing chat:', error);
        } finally {
            setLoading(false);
            // Don't reset isInitializingRef - keep it true to prevent re-initialization
        }
    };

    const fetchAssignedAdmin = async (adminId: string) => {
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('id, name, email')
                .eq('id', adminId)
                .single();

            if (!error && data) {
                setAssignedAdmin(data as Admin);
                console.log('👤 Assigned admin:', data);
            }
        } catch (err) {
            console.error('Error fetching admin:', err);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        const { data, error } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        setMessages(data || []);

        // Check if there's a real admin responding (not the system bot)
        // System bot has ID: 00000000-0000-0000-0000-000000000000
        const systemBotId = '00000000-0000-0000-0000-000000000000';
        const adminMessages = (data || []).filter(
            (msg: Message) => msg.sender_type === 'admin' && msg.sender_id !== systemBotId
        );

        if (adminMessages.length > 0 && !assignedAdmin) {
            // Get the first real admin who responded
            const adminId = adminMessages[0].sender_id;
            console.log('🔍 Found admin responder:', adminId);
            await fetchAdminFromMessages(adminId);
        }
    };

    const fetchAdminFromMessages = async (adminId: string) => {
        try {
            // First try 'admins' table
            let { data, error } = await supabase
                .from('admins')
                .select('id, name, email')
                .eq('id', adminId)
                .single();

            if (!error && data) {
                setAssignedAdmin(data as Admin);
                console.log('👤 Found admin in admins table:', data);
                return;
            }

            // If not found, try to get from auth.users via API
            const response = await fetch(`/api/admin/get-admin-info?id=${adminId}`);
            const result = await response.json();

            if (result.admin) {
                setAssignedAdmin(result.admin as Admin);
                console.log('👤 Found admin via API:', result.admin);
            }
        } catch (err) {
            console.error('Error fetching admin from messages:', err);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`conversation:${conversation?.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${conversation?.id}`,
                },
                (payload) => {
                    setMessages((current) => {
                        const exists = current.some((m) => m.id === (payload.new as Message).id);
                        return exists ? current : [...current, payload.new as Message];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation || !customer) return;

        setSending(true);
        try {
            const { data, error } = await supabase.from('support_messages').insert({
                conversation_id: conversation.id,
                sender_type: 'customer',
                sender_id: customer.id,
                message: newMessage.trim(),
                read_by_recipient: false,
            }).select().single();

            if (error) throw error;
            if (data) {
                setMessages((current) => {
                    const exists = current.some((m) => m.id === data.id);
                    return exists ? current : [...current, data];
                });
            } else {
                await fetchMessages(conversation.id);
            }
            setNewMessage("");
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="relative min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center pt-32">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-50 flex flex-col">
            <Header />

            {/* Chat Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 pt-20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/help" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">Support Chat</h1>
                            <p className="text-sm text-gray-600">
                                {order ? `${(order as any).restaurant?.name} • ` : ''}{issueLabels[issueType]}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${conversation?.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            conversation?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {conversation?.status?.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Connection Banner */}
            {assignedAdmin && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <div className="max-w-4xl mx-auto px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium text-sm">
                                {assignedAdmin.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-800">
                                    You are connected to <span className="font-semibold">{assignedAdmin.name}</span>
                                </p>
                                <p className="text-xs text-emerald-600">Latebites Support Agent</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* Order Context Card - Only show if there's an order */}
            {order && (
                <div className="bg-emerald-50 border-b border-emerald-100">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{(order as any).rescue_bag?.name}</p>
                                <p className="text-xs text-gray-600">Order from {(order as any).restaurant?.name}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">₹{order.total_price}</p>
                        </div>
                    </div>
                </div>
            )}


            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] ${msg.sender_type === 'customer' ? 'order-2' : 'order-1'}`}>
                                    <div className={`rounded-2xl px-4 py-3 ${msg.sender_type === 'customer'
                                        ? 'bg-[#0B1E0F] text-white'
                                        : 'bg-white border border-gray-200 text-gray-900'
                                        }`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 mt-1 px-2 ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                                        }`}>
                                        <p className="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
                                        {msg.sender_type === 'customer' && msg.read_by_recipient && (
                                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <form onSubmit={sendMessage} className="flex items-end gap-3">
                        <div className="flex-1">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                placeholder="Type your message..."
                                rows={1}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none"
                                style={{ maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="p-3 bg-[#0B1E0F] text-white rounded-xl hover:bg-[#142318] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Average response time: &lt; 2 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="relative min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center pt-32">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
