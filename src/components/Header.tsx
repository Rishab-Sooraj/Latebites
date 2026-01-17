"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ShoppingBag, UserCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import AuthModal from "./AuthModal";

// Sections with dark backgrounds where we need WHITE text
const darkSections = ["hero", "what-we-do", "vetting", "closing"];

export function Header() {
  const { user, customer, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [useDarkText, setUseDarkText] = useState(false); // false = white, true = black
  const [isAtTop, setIsAtTop] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Transform scroll position to opacity and translateY
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const translateY = useTransform(scrollY, [0, 200], [0, -20]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.9]);

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
          // If the section is currently in the viewport (near the top)
          if (top <= 50 && bottom > 50) {
            setUseDarkText(!darkSections.includes(sectionId));
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
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
        {/* Logo Section */}
        <div className="flex flex-col items-center pointer-events-auto cursor-pointer hover:opacity-80 transition-all duration-300">
          <Link href="/" className="flex flex-col items-center">
            <img
              src="/images/latebites-logo.jpg"
              alt="Latebites Logo"
              className={`w-8 h-8 md:w-10 md:h-10 object-contain mb-1 transition-all duration-300 ${useDarkText ? "mix-blend-multiply" : "invert mix-blend-screen"
                }`}
            />
            <span className={`font-serif italic text-lg sm:text-xl md:text-2xl tracking-tighter ${textColor}`}>
              Latebites
            </span>
          </Link>
        </div>

        {/* Navigation & Auth */}
        <div className="flex gap-4 sm:gap-6 md:gap-8 items-center pointer-events-auto">
          {user && customer ? (
            <div className="relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ opacity, y: translateY, scale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
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
                    className="absolute right-0 mt-2 w-48 bg-background border border-border shadow-xl rounded-sm overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border bg-secondary/20">
                      <p className="text-xs font-medium truncate">{customer.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{customer.email}</p>
                    </div>

                    <Link
                      href="/browse"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-secondary/50 transition-colors text-sm"
                      onClick={() => setShowDropdown(false)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Browse
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors text-sm text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              onClick={() => setShowAuthModal(true)}
              style={{ opacity, y: translateY, scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
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
