"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, CheckCheck, Clock, User, Package, AlertCircle, XCircle, CheckCircle, Mail, Bell, BellRing, Volume2 } from "lucide-react";
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
    customer_id: string;
    order_id: string;
    issue_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    }
    order: {
        total_amount: number;
        restaurant: {
            name: string;
        };
        rescue_bag: {
            name: string;
        };
    }
}

const issueLabels: Record<string, string> = {
    'value_not_met': "Bag didn't meet expected value",
    'quality_issue': 'Food quality/freshness issue',
    'missing_items': 'Missing items from bag',
    'wrong_order': 'Received wrong order',
    'pickup_issue': 'Pickup location/timing problem',
    'other': 'Other issue',
};

const statusColors: Record<string, string> = {
    'open': 'bg-yellow-100 text-yellow-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800',
};

const quickReplies = [
    "Thanks for reaching out! We're looking into this.",
    "I apologize for the inconvenience. Let me help you with that.",
    "We'll process your refund within 24 hours.",
    "Could you please provide more details about the issue?",
    "Your feedback has been noted. We'll work with the restaurant to prevent this.",
];

export default function SupportPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [adminId, setAdminId] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("open");
    const [openTicketCount, setOpenTicketCount] = useState(0);
    const [newTicketAlert, setNewTicketAlert] = useState<Conversation | null>(null);
    const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const conversationPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const selectedConversationRef = useRef<Conversation | null>(null);
    const supabase = createClient();

    // Keep ref in sync with state so callbacks can access latest value
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    useEffect(() => {
        initializeSupport();
    }, []);

    useEffect(() => {
        if (filterStatus) {
            fetchConversations();
        }
    }, [filterStatus]);

    // Subscribe to messages + fast-poll when conversation changes
    useEffect(() => {
        if (!selectedConversation?.id) return;

        fetchMessages(selectedConversation.id);

        // Realtime subscription (fires immediately when Supabase realtime works)
        const channel = supabase
            .channel(`messages:${selectedConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${selectedConversation.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((current) => {
                        const exists = current.some((m) => m.id === newMsg.id);
                        return exists ? current : [...current, newMsg];
                    });
                }
            )
            .subscribe();

        // Fast 3s poll as a guaranteed fallback (handles RLS-blocked realtime)
        const convId = selectedConversation.id;
        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/support/messages?conversation_id=${convId}`);
                if (!res.ok) return;
                const fresh: Message[] = await res.json();
                setMessages((current) => {
                    // Only update if there are new messages (avoid re-renders for identical lists)
                    if (fresh.length === current.length) return current;
                    // Merge: keep existing + add any new by id
                    const existingIds = new Set(current.map((m) => m.id));
                    const newOnes = fresh.filter((m) => !existingIds.has(m.id));
                    return newOnes.length > 0 ? [...current, ...newOnes] : current;
                });
            } catch { /* silent */ }
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [selectedConversation?.id]);


    // Set up global real-time subscription for new conversations + conversation updates
    useEffect(() => {
        // Subscribe to NEW conversations (new tickets)
        const newConvChannel = supabase
            .channel('new_conversations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_conversations',
                },
                () => {
                    // Refetch conversations to get full data with joins
                    fetchConversations();
                    fetchOpenTicketCount();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'support_conversations',
                },
                () => {
                    fetchConversations();
                    fetchOpenTicketCount();
                }
            )
            .subscribe();

        // Subscribe to ALL new messages (to show unread badges on conversations)
        const allMessagesChannel = supabase
            .channel('all_new_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Only mark as unread if it's from a customer and not the currently selected conversation
                    if (newMsg.sender_type === 'customer') {
                        const currentConv = selectedConversationRef.current;
                        if (!currentConv || currentConv.id !== newMsg.conversation_id) {
                            setUnreadConversations(prev => new Set([...prev, newMsg.conversation_id]));
                        }
                    }
                }
            )
            .subscribe();

        // Also poll conversations every 10s as backup
        conversationPollingRef.current = setInterval(() => {
            fetchConversations();
            fetchOpenTicketCount();
        }, 10000);

        return () => {
            supabase.removeChannel(newConvChannel);
            supabase.removeChannel(allMessagesChannel);
            if (conversationPollingRef.current) {
                clearInterval(conversationPollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Clear unread when selecting a conversation
    useEffect(() => {
        if (selectedConversation?.id) {
            setUnreadConversations(prev => {
                const next = new Set(prev);
                next.delete(selectedConversation.id);
                return next;
            });
        }
    }, [selectedConversation?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initializeSupport = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setAdminId(user.id);
            }
            await fetchConversations();
            await fetchOpenTicketCount();
        } catch (error) {
            console.error('Error initializing support:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOpenTicketCount = async () => {
        try {
            const response = await fetch('/api/support/conversations?status=open');
            if (response.ok) {
                const data = await response.json();
                const prevCount = openTicketCount;
                setOpenTicketCount(data.length || 0);

                // Show alert if new ticket came in
                if (data.length > prevCount && prevCount > 0 && data.length > 0) {
                    setNewTicketAlert(data[0]);
                    setTimeout(() => setNewTicketAlert(null), 5000);
                }
            }
        } catch (error) {
            console.error('Error fetching open ticket count:', error);
        }
    };

    const fetchConversations = async () => {
        try {
            const response = await fetch(`/api/support/conversations?status=${filterStatus}`);

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const data = await response.json();
            setConversations(data);

            // Auto-select first conversation if none selected
            if (!selectedConversationRef.current && data && data.length > 0) {
                setSelectedConversation(data[0]);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/support/messages?conversation_id=${conversationId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to fetch messages');
            }

            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async (text?: string) => {
        const messageText = text || newMessage.trim();

        if (!messageText || !selectedConversation || !adminId) {
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/support/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: selectedConversation.id,
                    sender_id: adminId,
                    message: messageText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to send message');
            }

            // Optimistic: add message immediately
            setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                return exists ? prev : [...prev, data];
            });

            // Update conversation status to in_progress if it's open
            if (selectedConversation.status === 'open') {
                await updateConversationStatus('in_progress');
            }

            setNewMessage("");
        } catch (error) {
            console.error('Error sending message:', error);
            // Fetch messages to ensure consistency
            await fetchMessages(selectedConversation.id);
        } finally {
            setSending(false);
        }
    };

    const updateConversationStatus = async (status: string) => {
        if (!selectedConversation) return;

        try {
            const response = await fetch('/api/support/conversations/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: selectedConversation.id,
                    status,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to update status');
            }

            // Update local state
            setSelectedConversation({ ...selectedConversation, status });
            await fetchConversations();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-73px)]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-73px)] flex bg-zinc-950 relative">
            {/* New Ticket Alert Toast */}
            <AnimatePresence>
                {newTicketAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -60, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -60, x: '-50%' }}
                        className="fixed top-4 left-1/2 z-[100] bg-amber-500 text-black px-6 py-3 rounded-xl shadow-2xl shadow-amber-500/20 flex items-center gap-3 min-w-[320px]"
                    >
                        <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center animate-pulse">
                            <BellRing className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">New Support Ticket!</p>
                            <p className="text-xs opacity-80">
                                {newTicketAlert.customer?.name || 'Customer'} needs help
                            </p>
                        </div>
                        <button
                            onClick={() => setNewTicketAlert(null)}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Conversations List */}
            <div className="w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-white">Support Chats</h1>
                        {/* Open Ticket Counter Badge */}
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${openTicketCount > 0
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                {openTicketCount > 0 ? (
                                    <BellRing className="w-4 h-4 animate-pulse" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                <span>{openTicketCount} open</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {['open', 'in_progress', 'resolved', 'all'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${filterStatus === status
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {status.replace('_', ' ').toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                            <p className="text-zinc-500 text-sm">No conversations yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={`w-full p-4 text-left hover:bg-zinc-800/50 transition-colors relative ${selectedConversation?.id === conv.id ? 'bg-zinc-800 border-l-4 border-amber-500' : ''
                                        }`}
                                >
                                    {/* Unread indicator */}
                                    {unreadConversations.has(conv.id) && (
                                        <div className="absolute top-3 right-3 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                                    )}
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-white text-sm">{conv.customer.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[conv.status]}`}>
                                            {conv.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mb-1">{conv.order.restaurant.name}</p>
                                    <p className="text-xs text-zinc-500 truncate">{issueLabels[conv.issue_type]}</p>
                                    <p className="text-xs text-zinc-600 mt-2">{formatTime(conv.updated_at)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
                <div className="flex-1 flex flex-col bg-zinc-900">
                    {/* Chat Header */}
                    <div className="bg-zinc-900 border-b border-zinc-800 p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-white mb-1">{selectedConversation.customer.name}</h2>
                                <div className="flex items-center gap-4 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {selectedConversation.customer.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {selectedConversation.customer.phone}
                                    </span>
                                </div>
                                <div className="mt-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                                    <p className="text-sm font-medium text-white">{selectedConversation.order.restaurant.name}</p>
                                    <p className="text-xs text-zinc-400">{selectedConversation.order.rescue_bag.name} • ₹{selectedConversation.order.total_amount}</p>
                                    <p className="text-xs text-amber-500 mt-1 font-medium">{issueLabels[selectedConversation.issue_type]}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedConversation.status !== 'resolved' && (
                                    <button
                                        onClick={() => updateConversationStatus('resolved')}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Resolved
                                    </button>
                                )}
                                {selectedConversation.status === 'resolved' && (
                                    <button
                                        onClick={() => updateConversationStatus('in_progress')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Reopen
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-950">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%]`}>
                                        <div className={`rounded-2xl px-4 py-3 ${msg.sender_type === 'admin'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-zinc-800 border border-zinc-700 text-white'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                        </div>
                                        <p className={`text-xs text-zinc-500 mt-1 px-2 ${msg.sender_type === 'admin' ? 'text-right' : 'text-left'
                                            }`}>
                                            {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies */}
                    <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800">
                        <div className="flex gap-2 flex-wrap">
                            {quickReplies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(reply)}
                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition-colors"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-6 bg-zinc-900 border-t border-zinc-800">
                        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-3">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Type your response..."
                                rows={2}
                                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl resize-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none placeholder-zinc-500"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-zinc-950">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <p className="text-zinc-500">Select a conversation to start chatting</p>
                    </div>
                </div>
            )}
        </div>
    );
}
