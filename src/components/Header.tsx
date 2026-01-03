"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, ShoppingBag, LayoutDashboard, UserCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AuthModal from "./AuthModal";

// Sections with dark backgrounds where we need WHITE text
const darkSections = ["hero", "what-we-do"];

export function Header() {
  const { user, customer, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [useDarkText, setUseDarkText] = useState(false); // false = white, true = black
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Transform scroll position to opacity and translateY
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const translateY = useTransform(scrollY, [0, 200], [0, -20]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.9]);

  useEffect(() => {
    const sections = ["hero", "problem", "belief", "what-we-do", "impact", "vision", "onboard"];

    const handleScroll = () => {
      // Consider "at top" if within first 100px
      setIsAtTop(window.scrollY < 100);

      // Detect which section we're in for color
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          // Check if header (top of viewport) is within this section
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

  // Close dropdown when clicking outside
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
                style={{
                  opacity,
                  y: translateY,
                  scale
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                aria-label="User menu"
              >
                <div className="text-sm font-medium">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    <div className="py-2">
                      <Link
                        href="/browse"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-sm text-gray-700"
                      >
                        <ShoppingBag className="w-4 h-4 text-orange-600" />
                        Browse
                      </Link>
                      <Link
                        href="/customer/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-sm text-gray-700"
                      >
                        <LayoutDashboard className="w-4 h-4 text-orange-600" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm text-gray-700"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
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
              style={{
                opacity,
                y: translateY,
                scale
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
              aria-label="Sign in or sign up"
            >
              <UserCircle className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </motion.header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
