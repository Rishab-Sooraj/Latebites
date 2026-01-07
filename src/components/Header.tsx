"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ShoppingBag, LayoutDashboard, UserCircle, History, User, HelpCircle, ArrowRight, Utensils, Loader2, Sparkles, Settings } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import AuthModal from "./AuthModal";
import { ProfileModal } from "./ProfileModal";
import { createClient } from "@/lib/supabase/client";

// Sections with dark backgrounds where we need WHITE text
const darkSections = ["hero", "what-we-do", "vetting", "closing"];

export function Header() {
  const { user, customer, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [useDarkText, setUseDarkText] = useState(false); // false = white, true = black
  const [isAtTop, setIsAtTop] = useState(true);
  const [recentRescues, setRecentRescues] = useState<any[]>([]);
  const [loadingRescues, setLoadingRescues] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const { scrollY } = useScroll();

  // Transform scroll position for premium effects
  const headerBgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 20]);
  const headerBorder = useTransform(scrollY, [0, 100], [0, 1]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.95]);
  const translateY = useTransform(scrollY, [0, 200], [0, -5]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.98]);

  const fetchRecentRescues = useCallback(async () => {
    if (!customer?.id) return;
    setLoadingRescues(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, rescue_bags (*), restaurants (*)`)
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) throw error;
      setRecentRescues(data || []);
    } catch (error) {
      console.error("Error fetching recent rescues in header:", error);
    } finally {
      setLoadingRescues(false);
    }
  }, [customer?.id, supabase]);

  useEffect(() => {
    if (showDropdown && user && customer) {
      fetchRecentRescues();
    }
  }, [showDropdown, user, customer, fetchRecentRescues]);

  useEffect(() => {
    const sections = [
      "hero", "problem", "belief", "what-we-do", "impact", "vision",
      "how-we-work", "vetting", "onboard", "closing"
    ];

    const handleScroll = () => {
      setIsAtTop(window.scrollY < 100);
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (top <= 80 && bottom > 80) {
            setUseDarkText(!darkSections.includes(sectionId));
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const textColor = useDarkText ? "text-black" : "text-white";

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 w-full z-50 px-6 py-4 md:px-12 md:py-6 flex justify-between items-center pointer-events-none"
      >
        {/* Natural Logo Placement */}
        <Link href="/#hero" className="flex items-center gap-3 pointer-events-auto group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white shadow-2xl shadow-black/10 flex items-center justify-center p-1.5 overflow-hidden ring-1 ring-black/5">
                <img
                    src="/images/latebites-logo.jpg"
                    alt="Latebites Logo"
                    className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`font-serif italic text-xl md:text-2xl tracking-tighter leading-none ${textColor} transition-colors duration-500`}>
                Latebites
            </span>
            <span className={`text-[8px] uppercase tracking-[0.4em] font-black opacity-40 ${textColor} transition-colors duration-500`}>
                Manifesto
            </span>
          </div>
        </Link>

        <div className="flex gap-6 items-center pointer-events-auto">
          {user && customer ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ opacity, y: translateY, scale }}
                className="group relative flex items-center gap-2 p-1 pr-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300 shadow-xl"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg overflow-hidden border border-white/40 group-hover:scale-105 transition-transform">
                  <span className="text-xs font-black">
                    {customer.name?.charAt(0).toUpperCase() || "R"}
                  </span>
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${textColor} transition-colors`}>Menu</span>
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-[60]"
                  >
                    {/* Header Info */}
                    <div className="p-8 bg-gradient-to-br from-orange-50/50 to-amber-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-primary via-orange-500 to-amber-500 text-white flex items-center justify-center font-serif text-2xl shadow-xl">
                                {customer.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-50">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-gray-900 truncate">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{customer.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      {/* Recent Rescues Section - Redesigned as Requested */}
                      <div className="p-5 rounded-[32px] bg-gray-50/80 mb-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Rescues</p>
                          </div>
                          <Link href="/orders" onClick={() => setShowDropdown(false)} className="text-[9px] font-black text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            ARCHIVE <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                        
                        <div className="space-y-3">
                          {loadingRescues ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            </div>
                          ) : recentRescues.length > 0 ? (
                            recentRescues.map((order) => (
                              <Link 
                                key={order.id} 
                                href={`/orders/${order.id}`}
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 p-2 rounded-2xl bg-white hover:shadow-md transition-all group/order"
                              >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/order:bg-primary/5 transition-colors">
                                  <Utensils className="w-4 h-4 text-orange-400 group-hover/order:text-primary transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold truncate text-gray-900">{order.rescue_bags?.title}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{order.restaurants?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-primary">₹{order.total_price}</p>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="text-center py-4 space-y-2">
                                <ShoppingBag className="w-6 h-6 text-gray-200 mx-auto" />
                                <p className="text-[10px] text-muted-foreground italic leading-tight">No rescues recorded yet</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main Navigation */}
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-all rounded-[24px] group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Settings className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Account Details</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>

                        <Link
                          href="/orders"
                          onClick={() => setShowDropdown(false)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-all rounded-[24px] group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <History className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Past Orders</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
                        </Link>

                        <Link
                          href="/help"
                          onClick={() => setShowDropdown(false)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-all rounded-[24px] group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">Get Help</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-all" />
                        </Link>
                      </div>

                      <div className="h-px bg-gray-100 mx-6 my-2" />

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-all text-sm text-red-600 rounded-[24px] font-bold group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <LogOut className="w-4 h-4" />
                        </div>
                        Sign Out Protocol
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={() => setShowAuthModal(true)}
              style={{ opacity, y: translateY, scale }}
              className="px-8 py-3 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black rounded-full shadow-2xl hover:bg-primary hover:text-white transition-all duration-500"
            >
              Access Portal
            </motion.button>
          )}
        </div>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}
