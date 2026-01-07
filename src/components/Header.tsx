"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ShoppingBag, LayoutDashboard, UserCircle, History, User, HelpCircle, ArrowRight, Utensils, Loader2 } from "lucide-react";
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

  // Transform scroll position to opacity and translateY
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const translateY = useTransform(scrollY, [0, 200], [0, -20]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.9]);

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
          if (top <= 50 && bottom > 50) {
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
        transition={{ delay: 0.5, duration: 1 }}
        className="fixed top-0 left-0 w-full z-50 px-4 py-4 sm:px-6 sm:py-6 md:px-12 md:py-12 flex justify-between items-center pointer-events-none"
      >
        <Link
          href="/"
          className={`font-serif italic text-lg sm:text-xl md:text-2xl tracking-tighter pointer-events-auto cursor-pointer hover:opacity-80 transition-all duration-300 ${textColor}`}
        >
          Latebites
        </Link>

        <div className="flex gap-4 sm:gap-6 md:gap-8 items-center pointer-events-auto">
          {user && customer ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ opacity, y: translateY, scale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg overflow-hidden border-2 border-white/20"
                aria-label="User menu"
              >
                <div className="text-sm font-medium">
                  {customer.name?.charAt(0).toUpperCase() || "R"}
                </div>
              </motion.button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    {/* Header Info */}
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center font-serif text-xl shadow-lg">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate max-w-[180px]">{customer.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Recent Rescues Section */}
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Rescues</p>
                          <Link href="/orders" className="text-[10px] font-bold text-orange-600 hover:opacity-80 transition-opacity">VIEW ALL</Link>
                        </div>
                        <div className="space-y-2">
                          {loadingRescues ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                            </div>
                          ) : recentRescues.length > 0 ? (
                            recentRescues.map((order) => (
                              <div key={order.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                  <Utensils className="w-4 h-4 text-orange-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{order.rescue_bags?.title}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{order.restaurants?.name}</p>
                                </div>
                                <ArrowRight className="w-3 h-3 text-gray-300" />
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-muted-foreground italic text-center py-2">No recent rescues yet</p>
                          )}
                        </div>
                      </div>

                      <div className="h-px bg-gray-100 mx-4" />

                      {/* Main Navigation */}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-sm text-gray-700 rounded-2xl"
                      >
                        <User className="w-4 h-4 text-orange-600" />
                        Account Details
                      </button>

                      <Link
                        href="/orders"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-sm text-gray-700 rounded-2xl"
                      >
                        <History className="w-4 h-4 text-orange-600" />
                        Past Orders
                      </Link>

                      <Link
                        href="/help"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-sm text-gray-700 rounded-2xl"
                      >
                        <HelpCircle className="w-4 h-4 text-orange-600" />
                        Get Help
                      </Link>

                      <div className="h-px bg-gray-100 mx-4" />

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm text-red-600 rounded-2xl"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
              aria-label="Sign in or sign up"
            >
              <UserCircle className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
