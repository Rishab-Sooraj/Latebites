"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, ShoppingBag, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, customer, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="fixed top-0 left-0 w-full z-50 px-4 py-4 sm:px-6 sm:py-6 md:px-12 md:py-12 flex justify-between items-center pointer-events-none"
    >
      <Link href="/" className="font-serif italic text-lg sm:text-xl md:text-2xl tracking-tighter pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity">
        Latebites
      </Link>

      <div className="flex gap-4 sm:gap-6 md:gap-8 items-center pointer-events-auto">
        {user && customer ? (
          <div className="flex items-center gap-4">
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-primary/10 rounded-full transition-colors text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse
            </Link>
            <Link
              href="/customer/dashboard"
              className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-primary/10 rounded-full transition-colors text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{customer.name}</span>
            </div>
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium hover:bg-primary/10 rounded-full transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
}
