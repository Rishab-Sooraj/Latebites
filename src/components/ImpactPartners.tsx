"use client";

import { motion } from "framer-motion";
import { RevealText } from "./cinematic/RevealText";
import { MapPin, Users, Leaf, ShoppingBag } from "lucide-react";

export function ImpactPartners() {
  const stats = [
    { label: "Meals Rescued", value: "25,000+", icon: ShoppingBag, color: "text-orange-600" },
    { label: "CO₂ Saved", value: "62,500 kg", icon: Leaf, color: "text-green-600" },
    { label: "Active Rescuers", value: "10,000+", icon: Users, color: "text-blue-600" },
    { label: "Cities Covered", value: "12", icon: MapPin, color: "text-red-600" },
  ];

  const partners = [
    { name: "The Kitchen Collective", logo: "/images/partners/logo1.png" },
    { name: "Urban Tandoor", logo: "/images/partners/logo2.png" },
    { name: "Spice Route", logo: "/images/partners/logo3.png" },
    { name: "Green Garden", logo: "/images/partners/logo4.png" },
    { name: "Bistro 24", logo: "/images/partners/logo5.png" },
    { name: "Royal Feast", logo: "/images/partners/logo6.png" },
  ];

  return (
    <section className="py-24 bg-secondary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <RevealText
            text="Our Collective Impact"
            tag="h2"
            className="text-3xl md:text-5xl font-serif mb-4"
          />
          <p className="text-muted-foreground max-w-2xl mx-auto font-light">
            Every bag rescued is a step towards a more sustainable future. Here's what we've achieved together in India.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-background border border-primary/5 rounded-sm hover:border-primary/20 transition-all shadow-sm"
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-4 ${stat.color} opacity-80`} />
              <h3 className="text-2xl md:text-3xl font-serif font-light mb-1">{stat.value}</h3>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Partners Section */}
        <div className="mb-24">
          <h3 className="text-center text-xs uppercase tracking-[0.4em] text-muted-foreground mb-12">Trusted Partner Restaurants</h3>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {partners.map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-sm font-serif italic"
              >
                {partner.name}
              </motion.div>
            ))}
          </div>
        </div>

        {/* India Map/Location section placeholder */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif">Growing Across India</h3>
            <p className="text-muted-foreground font-light leading-relaxed">
              Started in Coimbatore, we're rapidly expanding to major cities. Our mission is to ensure no edible food goes to waste in any corner of the country.
            </p>
            <div className="space-y-4">
              {['Coimbatore', 'Chennai', 'Bangalore', 'Hyderabad', 'Mumbai'].map((city, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-sm font-light">{city}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-square bg-muted/30 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-full" />
            <MapPin className="w-16 h-16 text-primary/20" />
            <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-primary rounded-full animate-ping" />
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
