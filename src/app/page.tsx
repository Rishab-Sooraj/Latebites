"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Instagram, Mail, Youtube } from "lucide-react";
import { Section } from "@/components/cinematic/Section";
import { RevealText } from "@/components/cinematic/RevealText";
import { ScrollProgressIndicator } from "@/components/ScrollProgressIndicator";
import { ScrollRevealImage } from "@/components/ScrollRevealImage";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/AuthModal";

import { Header } from "@/components/Header";
import "./3d-effects.css";
import "./premium-animations.css";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-open auth modal if redirected with ?auth=customer param
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'customer' && !user && !authLoading) {
      setShowAuthModal(true);
      // Clean up the URL
      router.replace('/');
    }
  }, [searchParams, user, authLoading, router]);

  // Handle OAuth callback when Supabase redirects to homepage with ?code=
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('Error exchanging code for session:', error);
          router.push('/?auth_error=true');
        } else {
          // Clear the URL and redirect to browse
          router.replace('/browse');
        }
      });
    }
  }, [searchParams, supabase.auth, router]);

  // Form state management
  const [formData, setFormData] = useState({
    restaurant_name: "",
    contact_person: "",
    email: "",
    phone_number: "",
    city: "Coimbatore",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'restaurant_name':
        return value.trim().length < 2 ? 'Restaurant name must be at least 2 characters' : '';
      case 'contact_person':
        return value.trim().length < 2 ? 'Contact person name must be at least 2 characters' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'phone_number':
        const phoneRegex = /^[+]?[0-9\s-]{10,}$/;
        return !phoneRegex.test(value) ? 'Please enter a valid phone number' : '';
      case 'city':
        return value.trim().length < 2 ? 'City name must be at least 2 characters' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const getInputBorderClass = (fieldName: string) => {
    if (!touchedFields[fieldName]) return 'border-primary/20';
    if (fieldErrors[fieldName]) return 'border-red-500';
    return 'border-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        errors[key] = error;
      }
    });

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouchedFields(allTouched);

    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      setSubmitMessage({ type: 'error', text: 'Please fix the errors above before submitting.' });
      return;
    }

    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: result.message });
        setFormData({
          restaurant_name: "",
          contact_person: "",
          email: "",
          phone_number: "",
          city: "Coimbatore",
        });
        setFieldErrors({});
        setTouchedFields({});
      } else {
        setSubmitMessage({ type: 'error', text: result.error || 'Something went wrong' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-background selection:bg-primary selection:text-primary-foreground">
      <Header />
      <ScrollProgressIndicator />
      {/* 1. HERO SECTION */}
      <Section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Full-bleed Background with Cinematic Zoom-in - Ken Burns Effect on Landing */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{
            scale: 1.15,
            filter: "blur(12px) brightness(0.8)"
          }}
          animate={{
            scale: 1.3,
            filter: "blur(0px) brightness(1)"
          }}
          transition={{
            scale: {
              duration: 20,
              ease: [0.25, 0.1, 0.25, 1] // Smooth ease-out for cinematic feel
            },
            filter: {
              duration: 2.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.3 // Slight delay for dramatic effect
            }
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/hero-indian-food.png')",
            }}
          />
        </motion.div>

        {/* Premium Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 z-[1]" />

        {/* Noise Texture */}
        <div className="absolute inset-0 z-[2] noise-overlay pointer-events-none" />

        {/* Blur Vignette */}
        <div className="absolute inset-0 z-[2] blur-vignette pointer-events-none" />

        {/* Content */}
        <div className="text-center space-y-8 max-w-5xl px-4 sm:px-6 relative z-10">
          {/* Brand Tag */}
          <motion.div
            initial={{ opacity: 0, y: -30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-3"
          >
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/50" />
            <span className="text-xs uppercase tracking-[0.5em] text-white/80 font-light">Latebites</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/50" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-serif font-light leading-[0.95] tracking-[-0.02em] text-white"
            style={{ textShadow: "0 8px 60px rgba(0,0,0,0.8)" }}
          >
            Rescue Food.
            <br />
            <motion.span
              className="italic text-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
            >
              Save the Planet.
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 font-light tracking-wide max-w-2xl mx-auto"
          >
            Get delicious surplus meals at <span className="text-white font-medium">50% off</span> from your favorite local restaurants.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {user ? (
              <Link
                href="/browse"
                className="btn-premium group relative inline-flex items-center gap-2 px-10 py-5 bg-white text-black text-xs uppercase tracking-[0.3em] rounded-sm font-medium overflow-hidden"
              >
                <span className="relative z-10">Find Rescue Bags</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-premium group relative inline-flex items-center gap-2 px-10 py-5 bg-white text-black text-xs uppercase tracking-[0.3em] rounded-sm font-medium overflow-hidden"
              >
                <span className="relative z-10">Find Rescue Bags</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </button>
            )}
            <Link
              href="#onboard"
              className="group relative inline-flex items-center gap-2 px-10 py-5 border border-white/30 text-white text-xs uppercase tracking-[0.3em] rounded-sm font-light hover:bg-white/5 hover:border-white/60 transition-all duration-500"
            >
              Partner With Us
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator - Premium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-white/40 text-[9px] uppercase tracking-[0.4em] font-light">Explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 via-white/20 to-transparent" />
          </motion.div>
        </motion.div>
      </Section>

      {/* 2. THE PROBLEM */}
      <Section id="problem" className="bg-secondary/20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center px-4 sm:px-6">
          <div className="space-y-8 md:space-y-12">
            <RevealText
              text="The silent departure."
              tag="h2"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic"
            />
            <RevealText
              text="Every night, in every city, perfectly good food quietly disappears. It’s not because it lacks value, but because we lack a way to value it in its final hours."
              className="text-xl md:text-2xl font-light leading-relaxed text-muted-foreground"
            />
            <RevealText
              text="This isn’t a failure of production. It's a failure of presence."
              className="text-lg font-medium text-foreground border-l-2 border-primary pl-6 py-2"
            />
          </div>
          <ScrollRevealImage
            src="/images/indian-thali.png"
            alt="Traditional Indian Thali"
            aspectRatio="portrait"
            className="rounded-sm"
          />
        </div>
      </Section>

      {/* 3. OUR BELIEF */}
      <Section id="belief">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <RevealText
            text="Rescue carries dignity. Discounts carry desperation."
            tag="h2"
            className="text-4xl md:text-7xl font-serif leading-tight"
          />
          <div className="grid md:grid-cols-3 gap-12 pt-12">
            {[
              {
                title: "Dignity",
                desc: "We respect the craft of every kitchen. Surplus is proof of hard work, not a mistake to be hidden.",
              },
              {
                title: "Transparency",
                desc: "Honesty over hype. We share what is left, exactly as it is, with those who intend to rescue it.",
              },
              {
                title: "Intention",
                desc: "Impact should feel calm. We don't rush the process; we enable a meaningful handover.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * i, duration: 1 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h3 className="text-xl font-serif italic text-primary">{item.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. WHAT WE DO */}
      <Section id="what-we-do" className="bg-primary text-primary-foreground overflow-hidden">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <ScrollRevealImage
            src="/images/paneer-curry.png"
            alt="Paneer Butter Masala"
            aspectRatio="portrait"
            className="rounded-sm"
          />
          <div className="space-y-12">
            <RevealText
              text="End-of-day intentionality."
              tag="h2"
              className="text-4xl md:text-6xl font-serif"
            />
            <div className="space-y-8 text-xl font-light text-primary-foreground/80">
              <RevealText text="We identify surplus as the kitchen closes." />
              <RevealText text="We enable local pickup for those who care." />
              <RevealText text="We ensure nothing goes into the dark." />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true }}
              className="pt-8 border-t border-primary-foreground/20"
            >
              <p className="text-sm uppercase tracking-[0.3em] font-light">
                Pickup only. Limited quantity. Zero waste.
              </p>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* 5. OUR IMPACT */}
      <Section id="impact">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-12 md:sticky md:top-24">
            <RevealText
              text="A shift in breathing."
              tag="h2"
              className="text-4xl md:text-6xl font-serif italic"
            />
            <p className="text-xl font-light leading-relaxed text-muted-foreground">
              When we rescue food, we don't just save calories. We save the water, the soil, the labor, and the spirit that went into its creation.
            </p>
          </div>
          <div className="space-y-24">
            {[
              {
                label: "Environmental",
                text: "Reducing the methane footprint of our cities, one night at a time.",
                img: "/images/street-chaat.png"
              },
              {
                label: "Cultural",
                text: "Rekindling the Indian value of 'Prasad'—that food is sacred and never to be wasted.",
                img: "/images/biryani-closeup.png"
              }
            ].map((item, i) => (
              <div key={i} className="space-y-8">
                <ScrollRevealImage src={item.img} alt={item.label} aspectRatio="square" className="rounded-sm" />
                <div className="space-y-4">
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">{item.label}</span>
                  <p className="text-2xl font-serif font-light">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 6. OUR VISION */}
      <Section id="vision" className="bg-secondary/10">
        <div className="max-w-3xl space-y-12">
          <RevealText
            text="Cities that breathe together."
            tag="h2"
            className="text-5xl md:text-7xl font-serif "
          />
          <p className="text-xl md:text-2xl font-light leading-relaxed text-muted-foreground">
            We envision a future where consumption is conscious, production is surgical, and waste is a relic of the past. A future where we respect the effort as much as the outcome.
          </p>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-px bg-primary/30"
          />
        </div>
      </Section>

      {/* 7. HOW WE WORK - Part 1: Bag System & Quality */}
      <Section id="how-we-work" className="bg-secondary/10">
        <div className="max-w-6xl mx-auto space-y-24 md:space-y-32">
          {/* Section Header */}
          <div className="max-w-3xl">
            <RevealText
              text="The mechanics of care."
              tag="h2"
              className="text-4xl sm:text-5xl md:text-7xl font-serif"
            />
            <p className="mt-8 text-lg sm:text-xl md:text-2xl font-light text-muted-foreground leading-relaxed">
              Intention without execution is just philosophy. Here's how we turn care into action.
            </p>
          </div>

          {/* Bag System */}
          <div className="space-y-12">
            <RevealText
              text="Three sizes. One promise."
              tag="h3"
              className="text-3xl sm:text-4xl md:text-5xl font-serif italic"
            />
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { size: "Small", description: "Perfect for one", discount: "50% off or more" },
                { size: "Medium", description: "Ideal for two", discount: "50% off or more" },
                { size: "Large", description: "Made for sharing", discount: "50% off or more" },
              ].map((bag, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group relative bg-background border border-primary/20 p-6 md:p-8 space-y-4 hover:border-primary/40 transition-all duration-500"
                >
                  <div className="space-y-2">
                    <h4 className="text-2xl md:text-3xl font-serif">{bag.size}</h4>
                    <p className="text-sm text-muted-foreground">{bag.description}</p>
                  </div>
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-lg font-medium text-primary">{bag.discount}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
                </motion.div>
              ))}
            </div>
            <div className="max-w-2xl space-y-4">
              <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed text-muted-foreground">
                Each calibrated to different appetites, different moments. But every bag carries the same guarantee: <span className="text-foreground font-medium">50% off or more</span>.
              </p>
              <p className="text-base sm:text-lg font-light leading-relaxed text-muted-foreground">
                Not a discount born of desperation, but of timing. Of understanding that value doesn't diminish at closing time.
              </p>
            </div>
          </div>

          {/* Quality Standards */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-8 md:space-y-12">
              <RevealText
                text="Standards without compromise."
                tag="h3"
                className="text-3xl sm:text-4xl md:text-5xl font-serif italic"
              />
              <div className="space-y-6">
                <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed">
                  We don't rescue waste. We rescue <span className="italic">surplus</span>. There's a difference, and we guard it fiercely.
                </p>
                <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed">
                  Every restaurant partner knows: <span className="font-medium">old food has no place here</span>. Neither does compromise. Our team doesn't just monitor hygiene—we monitor character. We track patterns. We build relationships. We intervene early.
                </p>
                <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed">
                  Because when you trust us with your dinner, we take that seriously.
                </p>
              </div>
              <div className="space-y-4 border-l-2 border-primary pl-6">
                <p className="text-xs uppercase tracking-widest text-primary font-bold">Our Promise</p>
                <ul className="space-y-3 text-sm sm:text-base font-light">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Fresh surplus only, never leftovers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Daily hygiene inspections</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Immediate intervention protocols</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Zero tolerance for violations</span>
                  </li>
                </ul>
              </div>
            </div>
            <ScrollRevealImage
              src="/images/south-indian-dosa.png"
              alt="South Indian Dosa"
              aspectRatio="portrait"
              className="rounded-sm"
            />
          </div>
        </div>
      </Section>

      {/* 7. HOW WE WORK - Part 2: Restaurant Vetting */}
      <Section
        id="vetting"
        className="overflow-hidden"
        style={{
          background: 'var(--navy)',
          color: 'var(--navy-foreground)'
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <RevealText
            text="Careful curation, not casual collection."
            tag="h3"
            className="text-3xl sm:text-4xl md:text-5xl font-serif italic"
          />
          <div className="space-y-6 text-left">
            <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed opacity-80">
              We don't onboard restaurants. We <span className="italic">partner</span> with them. And partnerships require scrutiny.
            </p>
            <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed opacity-80">
              Our vetting process is rigorous because it has to be. We're not building a marketplace—we're building trust.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              {
                title: "Character assessment",
                question: "Do they share our values?",
              },
              {
                title: "Hygiene verification",
                question: "Do their standards match ours?",
              },
              {
                title: "Operational alignment",
                question: "Can they commit to consistency?",
              },
              {
                title: "Ongoing monitoring",
                question: "Do they maintain excellence?",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{
                  scale: 1.05,
                  z: 30,
                  borderColor: "hsl(var(--primary-foreground))",
                  backgroundColor: "hsl(var(--primary-foreground) / 0.05)",
                }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                viewport={{ once: true }}
                style={{ transformStyle: "preserve-3d" }}
                className="p-8 border-2 border-primary-foreground/20 rounded-sm cursor-pointer bg-primary-foreground/5 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary-foreground/10 transition-all"
              >
                <h4 className="text-lg sm:text-xl font-semibold tracking-tight">{item.title}</h4>
                <p className="text-sm sm:text-base text-primary-foreground/70 font-light italic leading-relaxed">{item.question}</p>
              </motion.div>
            ))}
          </div>
          <div className="space-y-6 pt-8">
            <p className="text-base sm:text-lg md:text-xl font-light leading-relaxed">
              We're stern because we care. We care for you the way we care for the food. The way we care for the environment. The way we care for the future we're building together.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-serif italic text-primary-foreground">
              Rejection isn't failure. It's protection.
            </p>
          </div>
        </div>
      </Section>



      {/* 8. RESTAURANT ONBOARDING */}
      <Section id="onboard" className="bg-secondary/20">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <RevealText
              text="Join the Latebites movement."
              tag="h2"
              className="text-4xl md:text-6xl font-serif"
            />
            <p className="text-xl font-light text-muted-foreground leading-relaxed">
              We're looking for partner restaurants who value their craft and care about their surplus. Rescue your effort with us in Coimbatore.
            </p>
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-4 text-sm tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px w-8 bg-primary/30" />
                <span>Smooth Onboarding</span>
              </div>
              <div className="flex items-center gap-4 text-sm tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px w-8 bg-primary/30" />
                <span>Intentional Reach</span>
              </div>
              <div className="flex items-center gap-4 text-sm tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px w-8 bg-primary/30" />
                <span>Dignified Disposal</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="bg-background p-8 md:p-12 rounded-sm border border-primary/10 shadow-sm"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Restaurant Name</label>
                <input
                  type="text"
                  name="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="The Kitchen Collective"
                  required
                  className={`w-full bg-transparent border-b-2 ${getInputBorderClass('restaurant_name')} py-3 focus:outline-none transition-colors font-light`}
                />
                {touchedFields.restaurant_name && fieldErrors.restaurant_name && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.restaurant_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Your Name"
                  required
                  className={`w-full bg-transparent border-b-2 ${getInputBorderClass('contact_person')} py-3 focus:outline-none transition-colors font-light`}
                />
                {touchedFields.contact_person && fieldErrors.contact_person && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.contact_person}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="your@email.com"
                  required
                  className={`w-full bg-transparent border-b-2 ${getInputBorderClass('email')} py-3 focus:outline-none transition-colors font-light`}
                />
                {touchedFields.email && fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="+91 ...."
                  required
                  className={`w-full bg-transparent border-b-2 ${getInputBorderClass('phone_number')} py-3 focus:outline-none transition-colors font-light`}
                />
                {touchedFields.phone_number && fieldErrors.phone_number && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  readOnly
                  className="w-full bg-transparent border-b border-primary/20 py-3 focus:outline-none focus:border-primary transition-colors font-light opacity-50"
                />
              </div>

              {submitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-light py-3 px-4 rounded-sm ${submitMessage.type === 'success'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                >
                  {submitMessage.text}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-8 bg-primary text-primary-foreground text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Apply to Rescue'}
              </button>
            </form>
          </motion.div>
        </div>
      </Section>

      {/* 9. CLOSING STATEMENT */}
      <Section id="closing" className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-12">
          <RevealText
            text="Latebites."
            className="text-6xl md:text-9xl font-serif italic font-light tracking-tighter"
          />
          <RevealText
            text="We’re just getting started."
            className="text-2xl md:text-3xl font-serif italic font-light opacity-60"
            delay={0.5}
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
            className="space-y-8 pt-12"
          >
            <div className="flex justify-center gap-8 items-center">
              <a
                href="https://youtube.com/@latebites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/60 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/latebites.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@latebites.in"
                className="text-muted-foreground/60 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/70">© 2024 Latebites - Coimbatore, India. All rights reserved.</p>
          </motion.div>
        </div>
      </Section>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </main >
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomePageContent />
    </Suspense>
  );
}
