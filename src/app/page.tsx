"use client";

import { motion } from "motion/react";
import { Section } from "@/components/cinematic/Section";
import { RevealText } from "@/components/cinematic/RevealText";
import { ParallaxImage } from "@/components/cinematic/ParallaxImage";

import { Header } from "@/components/Header";

export default function HomePage() {
  return (
    <main className="bg-background selection:bg-primary selection:text-primary-foreground">
      <Header />
      {/* 1. HERO SECTION */}
      <Section className="relative h-screen flex items-center justify-center">
        <div className="text-center space-y-8 max-w-4xl">
          <RevealText
            text="Surplus is a gift, not a burden."
            tag="h1"
            className="text-5xl md:text-8xl font-serif font-light leading-[1.1] tracking-tight"
            delay={0.2}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-lg md:text-xl text-muted-foreground font-light tracking-wide max-w-xl mx-auto"
          >
            A manifesto for intentional food rescue.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-muted-foreground/40 text-sm uppercase tracking-[0.2em]"
        >
          Scroll to breathe
        </motion.div>
      </Section>

      {/* 2. THE PROBLEM */}
      <Section className="bg-secondary/20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-12">
            <RevealText
              text="The silent departure."
              tag="h2"
              className="text-4xl md:text-6xl font-serif italic"
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
          <ParallaxImage
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1074"
            alt="Surplus vegetables"
            aspectRatio="portrait"
            className="rounded-sm grayscale hover:grayscale-0 transition-all duration-1000"
          />
        </div>
      </Section>

      {/* 3. OUR BELIEF */}
      <Section>
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
      <Section className="bg-primary text-primary-foreground overflow-hidden">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <ParallaxImage
            src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=687"
            alt="Handing over food"
            aspectRatio="portrait"
            className="rounded-sm opacity-80"
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
      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div className="space-y-12 sticky top-24">
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
                img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1170"
              },
              {
                label: "Cultural",
                text: "Rekindling the Indian value of 'Prasad'—that food is sacred and never to be wasted.",
                img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1170"
              }
            ].map((item, i) => (
              <div key={i} className="space-y-8">
                <ParallaxImage src={item.img} alt={item.label} aspectRatio="square" className="rounded-sm" />
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
      <Section className="bg-secondary/10">
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

      {/* 7. CLOSING STATEMENT */}
      <Section className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-12">
          <RevealText
            text="We’re just getting started."
            className="text-4xl md:text-6xl font-serif italic font-light"
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1, duration: 2 }}
            className="space-y-4 pt-12"
          >
            <p className="text-muted-foreground tracking-widest uppercase text-xs">Based in Mumbai — Enabling Change Digitally</p>
            <div className="flex justify-center gap-8 text-sm font-light text-muted-foreground/60">
              <a href="#" className="hover:text-white transition-colors">Manifesto</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">Email</a>
            </div>
          </motion.div>
        </div>
      </Section>
    </main>
  );
}
