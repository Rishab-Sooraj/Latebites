"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Instagram, Mail, Youtube, Clock, MapPin, ShoppingBag, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/Header";
import { OurAimSection } from "@/components/OurAimSection";

// Lazy-load non-critical components — keeps initial JS bundle smaller
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const ScrollProgressIndicator = dynamic(
  () => import("@/components/ScrollProgressIndicator").then((m) => ({ default: m.ScrollProgressIndicator })),
  { ssr: false }
);

/* ── Motion config ── */
const ease = [0.22, 1, 0.36, 1] as const;
const STAGGER = 0.12;

/* Reusable scroll-reveal wrapper — animates once, no motion on reduced-motion */
function Reveal({
  children,
  delay = 0,
  className = "",
  y = 40,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.75, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const prefersReduced = useReducedMotion();

  /* Hero parallax */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "customer" && !user && !authLoading) {
      setShowAuthModal(true);
      router.replace("/");
    }
  }, [searchParams, user, authLoading, router]);

  /* ── Form state ── */
  const [formData, setFormData] = useState({
    restaurant_name: "",
    contact_person: "",
    email: "",
    phone_number: "",
    city: "Coimbatore",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "restaurant_name":
        return value.trim().length < 2 ? "Restaurant name must be at least 2 characters" : "";
      case "contact_person":
        return value.trim().length < 2 ? "Name must be at least 2 characters" : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Please enter a valid email" : "";
      case "phone_number":
        return !/^[+]?[0-9\s-]{10,}$/.test(value) ? "Please enter a valid phone number" : "";
      case "city":
        return value.trim().length < 2 ? "City name required" : "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const getInputBorderClass = (fieldName: string) => {
    if (!touchedFields[fieldName]) return "border-[#0B1E0F]/20 focus:border-[#0B1E0F]/60";
    if (fieldErrors[fieldName]) return "border-red-500";
    return "border-green-600";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    const errors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => { allTouched[key] = true; });
    setTouchedFields(allTouched);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      setSubmitMessage({ type: "error", text: "Please fix the errors above." });
      return;
    }

    try {
      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setSubmitMessage({ type: "success", text: result.message });
        setFormData({ restaurant_name: "", contact_person: "", email: "", phone_number: "", city: "Coimbatore" });
        setFieldErrors({});
        setTouchedFields({});
      } else {
        setSubmitMessage({ type: "error", text: result.error || "Something went wrong" });
      }
    } catch {
      setSubmitMessage({ type: "error", text: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCTA = () => {
    if (user) router.push("/browse");
    else setShowAuthModal(true);
  };

  return (
    <main className="bg-[#F7F4EB] text-[#0B1E0F] selection:bg-[#0B1E0F] selection:text-[#F7F4EB]">
      <Header />
      <ScrollProgressIndicator />

      {/* ════════════════════════════════════════════
          SECTION 1 — HERO
          ════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      >
        {/* BG image with parallax */}
        <motion.div
          className="absolute inset-0 z-0 will-change-transform"
          style={{ y: prefersReduced ? 0 : heroImageY }}
        >
          <Image
            src="/images/hero-indian-food.webp"
            alt="Fresh Indian food spread"
            fill
            priority
            fetchPriority="high"
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 100vw"
            quality={85}
          />
          {/* Overlay: dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        </motion.div>

        {/* Content — hero text renders immediately (no initial opacity:0) so LCP isn't blocked by animations */}
        <motion.div
          className="relative z-10 text-center px-5 sm:px-8 max-w-3xl mx-auto"
          style={{ opacity: prefersReduced ? 1 : heroOpacity }}
        >
          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-xs sm:text-sm tracking-[0.25em] uppercase text-[#F7F4EB]/60 mb-5 sm:mb-6 font-light"
          >
            Surplus food from local restaurants
          </motion.p>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease }}
            className="text-[2.5rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-[-0.02em] text-[#F7F4EB]"
          >
            Fresh food from{" "}
            <br className="hidden sm:block" />
            nearby restaurants.
            <br />
            <span className="italic text-[#F7F4EB]/80">At a lower price.</span>
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-5 sm:mt-7 text-[0.95rem] sm:text-lg text-[#F7F4EB]/60 font-light max-w-lg mx-auto leading-relaxed"
          >
            Restaurants have surplus food every day. We pack it into Mystery Bags
            so you get a great meal — and nothing goes to waste.
          </motion.p>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
          >
            <button
              onClick={handleCTA}
              className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-[#F7F4EB] text-[#0B1E0F] text-sm sm:text-[0.95rem] font-medium rounded-full hover:bg-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Find food near you
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              href="#partner"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-[#F7F4EB]/25 text-[#F7F4EB] text-sm sm:text-[0.95rem] font-light rounded-full hover:bg-[#F7F4EB]/10 hover:border-[#F7F4EB]/40 transition-all duration-300"
            >
              List your restaurant
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 border-[1.5px] border-white/25 rounded-full flex justify-center pt-1.5"
          >
            <div className="w-1 h-1.5 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION — OUR AIM (scroll text reveal)
          ════════════════════════════════════════════ */}
      <OurAimSection />

      {/* ════════════════════════════════════════════
          SECTION 2 — HOW IT WORKS
          ════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 sm:py-32 md:py-40 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16 sm:mb-20">
            <p className="text-xs tracking-[0.25em] uppercase text-[#4A5D4D]/60 mb-4 font-medium">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light leading-tight">
              Three steps. That&apos;s it.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
            {[
              {
                step: "01",
                icon: <MapPin className="w-5 h-5" />,
                title: "Browse nearby",
                desc: "See which restaurants near you have Mystery Bags available right now.",
              },
              {
                step: "02",
                icon: <ShoppingBag className="w-5 h-5" />,
                title: "Reserve a bag",
                desc: "Pick a size, pay online. You won't know exactly what's inside — that's the fun part.",
              },
              {
                step: "03",
                icon: <Clock className="w-5 h-5" />,
                title: "Pick it up",
                desc: "Walk into the restaurant during the pickup window. Your food is ready.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * STAGGER}>
                <div className="group relative bg-white/50 backdrop-blur-sm border border-[#D1CEC2]/80 rounded-2xl p-7 sm:p-8 hover:shadow-xl hover:shadow-[#0B1E0F]/5 hover:-translate-y-1.5 transition-all duration-500 h-full">
                  {/* Step number */}
                  <span className="text-[0.65rem] font-medium text-[#4A5D4D]/40 tracking-[0.2em] uppercase">
                    Step {item.step}
                  </span>

                  {/* Icon */}
                  <div className="mt-5 w-11 h-11 rounded-xl bg-[#0B1E0F] text-[#F7F4EB] flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    {item.icon}
                  </div>

                  <h3 className="mt-5 text-xl sm:text-2xl font-serif font-normal">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-[0.9rem] text-[#4A5D4D] font-light leading-relaxed">
                    {item.desc}
                  </p>

                  {/* Decorative connector line (desktop only) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-[#D1CEC2]" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — MYSTERY BAGS
          ════════════════════════════════════════════ */}
      <section id="mystery-bags" className="relative py-24 sm:py-32 md:py-40 px-5 sm:px-8 bg-[#0B1E0F] text-[#F7F4EB] overflow-hidden">
        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-5xl mx-auto">
          <Reveal className="text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F7F4EB]/8 border border-[#F7F4EB]/10 rounded-full text-xs tracking-[0.2em] uppercase text-[#F7F4EB]/50 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              The concept
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light">
              What&apos;s a Mystery Bag?
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[#F7F4EB]/50 font-light max-w-2xl mx-auto leading-relaxed">
              A bag of freshly prepared surplus food from a restaurant near you.
              You don&apos;t choose the items — the restaurant packs what they have extra.
              The minimum value is always guaranteed.
            </p>
          </Reveal>

          {/* Bag sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-16 sm:mb-20">
            {[
              { size: "Small", serves: "For 1", worth: "150+", price: "79" },
              { size: "Medium", serves: "For 2", worth: "300+", price: "159", featured: true },
              { size: "Large", serves: "For 3–4", worth: "500+", price: "259" },
            ].map((bag, i) => (
              <Reveal key={i} delay={i * STAGGER}>
                <div
                  className={`group relative rounded-2xl p-7 sm:p-8 transition-all duration-500 cursor-default ${bag.featured
                    ? "bg-[#F7F4EB]/10 border-2 border-[#F7F4EB]/20 hover:border-[#F7F4EB]/40"
                    : "border border-[#F7F4EB]/10 hover:border-[#F7F4EB]/25 hover:bg-[#F7F4EB]/5"
                    }`}
                >
                  {bag.featured && (
                    <span className="absolute -top-3 left-7 px-3 py-0.5 bg-[#F7F4EB] text-[#0B1E0F] text-[0.65rem] tracking-[0.15em] uppercase font-medium rounded-full">
                      Popular
                    </span>
                  )}

                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl sm:text-3xl font-serif">{bag.size}</h3>
                    <span className="text-xs text-[#F7F4EB]/35 tracking-wider uppercase font-light">
                      {bag.serves}
                    </span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#F7F4EB]/8">
                    <p className="text-sm text-[#F7F4EB]/40 font-light">
                      Worth ₹{bag.worth}
                    </p>
                    <p className="mt-1.5 text-3xl sm:text-4xl font-serif tracking-tight">
                      ₹{bag.price}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Trust points */}
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 sm:gap-8">
              {[
                { label: "Freshly prepared same day", icon: "fresh" },
                { label: "Veg & non-veg options shown", icon: "diet" },
                { label: "Pickup time clearly listed", icon: "time" },
                { label: "Minimum value guaranteed", icon: "value" },
              ].map((point, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-[#F7F4EB]/8 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#F7F4EB]/40 rounded-full" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#F7F4EB]/45 font-light leading-relaxed">
                    {point.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — WHY LATEBITES
          ════════════════════════════════════════════ */}
      <section id="why" className="py-24 sm:py-32 md:py-40 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Image */}
            <Reveal y={30} className="order-2 md:order-1">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-[#0B1E0F]/10">
                <Image
                  src="/images/indian-thali.webp"
                  alt="Traditional Indian Thali"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                />
                {/* Soft overlay at bottom for depth */}
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </Reveal>

            {/* Copy */}
            <div className="order-1 md:order-2 space-y-8">
              <Reveal>
                <p className="text-xs tracking-[0.25em] uppercase text-[#4A5D4D]/60 mb-4 font-medium">
                  Why Latebites
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-light leading-[1.15]">
                  Why people use{" "}
                  <span className="italic">Latebites</span>
                </h2>
              </Reveal>

              <div className="space-y-5">
                {[
                  {
                    title: "Good food, lower price",
                    text: "Same food the restaurant sells — just at a better price because it's surplus.",
                  },
                  {
                    title: "From restaurants you know",
                    text: "Only vetted local restaurants. No random kitchens, no ghost brands.",
                  },
                  {
                    title: "Quick and easy pickup",
                    text: "Reserve online, walk in during the pickup window, grab your bag.",
                  },
                  {
                    title: "Less food wasted",
                    text: "Every bag you pick up is food that would've been thrown away.",
                  },
                ].map((item, i) => (
                  <Reveal key={i} delay={i * 0.08} y={20}>
                    <div className="group border-l-2 border-[#0B1E0F]/10 pl-5 hover:border-[#0B1E0F]/40 transition-colors duration-400">
                      <h3 className="text-[0.95rem] sm:text-base font-medium tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#4A5D4D] font-light leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5 — PARTNER / ONBOARD
          ════════════════════════════════════════════ */}
      <section id="partner" className="relative py-24 sm:py-32 md:py-40 px-5 sm:px-8 bg-[#001220] text-[#F7F4EB] overflow-hidden">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(247,244,235,0.03)_0%,_transparent_60%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
            {/* Left copy */}
            <Reveal className="space-y-6">
              <p className="text-xs tracking-[0.25em] uppercase text-[#F7F4EB]/40 font-medium">
                For restaurants
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light leading-tight">
                Own a restaurant?
              </h2>
              <p className="text-base sm:text-lg text-[#F7F4EB]/50 font-light leading-relaxed">
                You already make great food. We help you sell what&apos;s left over
                — instead of throwing it away. No extra effort. No delivery logistics.
              </p>
              <div className="space-y-3.5 pt-2">
                {[
                  "Sell surplus food instead of wasting it",
                  "We handle discovery and payments",
                  "Customers come to you for pickup",
                  "Currently onboarding in Coimbatore",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-2 w-1 h-1 bg-[#F7F4EB]/30 rounded-full flex-shrink-0" />
                    <span className="text-sm text-[#F7F4EB]/50 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Form */}
            <Reveal delay={0.1}>
              <div className="bg-[#F7F4EB] text-[#0B1E0F] rounded-2xl p-7 sm:p-10 shadow-2xl shadow-black/20">
                <h3 className="text-xl sm:text-2xl font-serif mb-1">Get started</h3>
                <p className="text-sm text-[#4A5D4D] font-light mb-7">
                  We&apos;ll reach out within 24 hours.
                </p>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {[
                    { label: "Restaurant Name", name: "restaurant_name", type: "text", placeholder: "Your restaurant" },
                    { label: "Contact Person", name: "contact_person", type: "text", placeholder: "Your name" },
                    { label: "Email", name: "email", type: "email", placeholder: "you@email.com" },
                    { label: "Phone", name: "phone_number", type: "tel", placeholder: "+91 ..." },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="text-[0.65rem] font-medium text-[#4A5D4D] tracking-[0.15em] uppercase">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder={field.placeholder}
                        required
                        className={`mt-1.5 w-full bg-transparent border-b-2 ${getInputBorderClass(field.name)} py-3 text-sm focus:outline-none transition-colors duration-300 font-light placeholder:text-[#0B1E0F]/25`}
                      />
                      {touchedFields[field.name] && fieldErrors[field.name] && (
                        <p className="text-xs text-red-500 mt-1.5">{fieldErrors[field.name]}</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="text-[0.65rem] font-medium text-[#4A5D4D] tracking-[0.15em] uppercase">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      readOnly
                      className="mt-1.5 w-full bg-transparent border-b border-[#0B1E0F]/10 py-3 text-sm font-light opacity-40"
                    />
                  </div>

                  {submitMessage && (
                    <div
                      className={`text-sm font-light py-3 px-4 rounded-xl ${submitMessage.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                    >
                      {submitMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-4 bg-[#0B1E0F] text-[#F7F4EB] text-sm font-medium rounded-full hover:bg-[#0B1E0F]/90 hover:shadow-lg active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Apply to partner"}
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6 — FOOTER
          ════════════════════════════════════════════ */}
      <section id="footer" className="py-16 sm:py-24 px-5 sm:px-8 bg-[#0B1E0F] text-[#F7F4EB]">
        <div className="max-w-5xl mx-auto">
          {/* Closing CTA */}
          <div className="text-center mb-16 sm:mb-20 pb-16 sm:pb-20 border-b border-[#F7F4EB]/8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light leading-tight">
              Good food shouldn&apos;t go to waste.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#F7F4EB]/45 font-light">
              Try a Mystery Bag from a restaurant near you.
            </p>
            <button
              onClick={handleCTA}
              className="group mt-8 sm:mt-10 inline-flex items-center gap-2.5 px-8 py-4 bg-[#F7F4EB] text-[#0B1E0F] text-sm sm:text-[0.95rem] font-medium rounded-full hover:bg-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              Find food near you
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Footer meta */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/images/latebites-logo.jpg"
                alt="Latebites"
                className="w-7 h-7 object-contain invert opacity-70"
              />
              <span className="font-serif italic text-lg text-[#F7F4EB]/70">
                Latebites
              </span>
            </div>

            <div className="flex gap-5">
              {[
                { href: "https://youtube.com/@latebites", icon: <Youtube className="w-[18px] h-[18px]" />, label: "YouTube" },
                { href: "https://instagram.com/latebites.in", icon: <Instagram className="w-[18px] h-[18px]" />, label: "Instagram" },
                { href: "mailto:support@latebites.in", icon: <Mail className="w-[18px] h-[18px]" />, label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-[#F7F4EB]/30 hover:text-[#F7F4EB]/80 transition-colors duration-300"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Legal links */}
          <div className="mt-8 pt-6 border-t border-[#F7F4EB]/8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-[#F7F4EB]/25 font-light">
              &copy; 2025 Latebites &middot; Coimbatore, India
            </p>
            <div className="flex gap-5 text-xs text-[#F7F4EB]/30">
              <Link href="/terms" className="hover:text-[#F7F4EB]/60 transition-colors duration-300">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="hover:text-[#F7F4EB]/60 transition-colors duration-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F4EB]" />}>
      <HomePageContent />
    </Suspense>
  );
}
