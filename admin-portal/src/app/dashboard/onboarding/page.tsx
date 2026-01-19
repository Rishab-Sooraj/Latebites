"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, CheckCircle, XCircle, Clock, Mail, MapPin, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Application {
    id: string;
    restaurant_name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    status: string;
    created_at: string;
}

export default function OnboardingPage() {
    const supabase = createClient();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            // Try both possible table names
            let data, error;

            // First try "Restaurant Onboarding"
            const result1 = await supabase
                .from('Restaurant Onboarding')
                .select('*')
                .order('created_at', { ascending: false });

            if (result1.error) {
                // If that fails, try "Resturant Onboarding" (typo in original)
                const result2 = await supabase
                    .from('Resturant Onboarding')
                    .select('*')
                    .order('created_at', { ascending: false });

                data = result2.data;
                error = result2.error;
            } else {
                data = result1.data;
                error = result1.error;
            }

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'rejected':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.city?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || app.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalCount = applications.length;
    const pendingCount = applications.filter(a => !a.status || a.status?.toLowerCase() === 'pending').length;
    const approvedCount = applications.filter(a => a.status?.toLowerCase() === 'approved').length;
    const rejectedCount = applications.filter(a => a.status?.toLowerCase() === 'rejected').length;

    const filterButtons = [
        { label: 'All', value: 'all', count: totalCount },
        { label: 'Pending', value: 'pending', count: pendingCount },
        { label: 'Approved', value: 'approved', count: approvedCount },
        { label: 'Rejected', value: 'rejected', count: rejectedCount },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif text-white">Restaurant Onboarding</h1>
                <p className="text-zinc-500 mt-1">Review and manage restaurant applications</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-sm">Total Applications</p>
                    <p className="text-3xl font-semibold text-white mt-1">{totalCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-500 text-sm">Pending Review</p>
                    <p className="text-3xl font-semibold text-white mt-1">{pendingCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-500 text-sm">Approved</p>
                    <p className="text-3xl font-semibold text-white mt-1">{approvedCount}</p>
                </div>
                <div className="bg-zinc-900/50 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-500 text-sm">Rejected</p>
                    <p className="text-3xl font-semibold text-white mt-1">{rejectedCount}</p>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                {filterButtons.map((btn) => (
                    <button
                        key={btn.value}
                        onClick={() => setStatusFilter(btn.value)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${statusFilter === btn.value
                                ? 'bg-amber-500 text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                    >
                        {btn.label}
                        {btn.count > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${statusFilter === btn.value
                                    ? 'bg-black/20 text-black'
                                    : 'bg-zinc-700 text-zinc-300'
                                }`}>
                                {btn.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search by name, email, owner, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
            </div>

            {/* Applications List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-pulse">
                            <div className="h-6 w-1/3 bg-zinc-800 rounded mb-4" />
                            <div className="h-4 w-1/2 bg-zinc-800 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredApplications.length > 0 ? (
                <div className="space-y-3">
                    {filteredApplications.map((app, index) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Store className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-lg">{app.restaurant_name}</h3>
                                        <p className="text-sm text-zinc-400">
                                            {app.contact_person} • {app.email}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{app.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(app.status || 'pending')}`}>
                                        {app.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                        {app.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-1" />}
                                        {(!app.status || app.status === 'pending') && <Clock className="w-3 h-3 inline mr-1" />}
                                        {(app.status || 'Pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                                    </span>
                                    <p className="text-xs text-zinc-600 mt-2">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                    <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
                    <p className="text-zinc-500">
                        {searchQuery || statusFilter !== "all"
                            ? 'Try adjusting your filters'
                            : 'Restaurant applications will appear here when submitted'}
                    </p>
                </div>
            )}
        </div>
    );
}
