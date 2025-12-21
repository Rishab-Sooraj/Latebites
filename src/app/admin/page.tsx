"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { Section } from "@/components/cinematic/Section";
import { motion } from "motion/react";

interface OnboardingResponse {
  id: string;
  created_at: string;
  restaurant_name: string;
  contact_person: string;
  phone_number: string;
  city: string;
}

export default function AdminPage() {
  const [responses, setResponses] = useState<OnboardingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResponses() {
      try {
        const { data, error } = await supabase
          .from("onboarding")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResponses(data || []);
      } catch (err: any) {
        console.error("Error fetching responses:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResponses();
  }, []);

  return (
    <main className="bg-background min-h-screen">
      <Header />
      <Section className="pt-32">
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-serif">Onboarding Responses</h1>
            <p className="text-muted-foreground font-light tracking-wide">
              {responses.length} restaurant(s) have applied to join Latebites.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse font-light uppercase tracking-widest text-xs">
              Retrieving applications...
            </div>
          ) : error ? (
            <div className="p-8 border border-red-500/20 bg-red-500/5 text-red-500 rounded-sm font-light">
              Error loading responses: {error}
            </div>
          ) : responses.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground font-light border border-dashed border-primary/20 rounded-sm">
              No applications received yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Date</th>
                    <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Restaurant</th>
                    <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Contact</th>
                    <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Phone</th>
                    <th className="py-4 px-4 text-[10px] uppercase tracking-widest font-medium text-muted-foreground">City</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((res, i) => (
                    <motion.tr
                      key={res.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-primary/5 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-6 px-4 text-sm font-light text-muted-foreground">
                        {new Date(res.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-6 px-4 font-serif text-lg italic">{res.restaurant_name}</td>
                      <td className="py-6 px-4 text-sm font-light">{res.contact_person}</td>
                      <td className="py-6 px-4 text-sm font-light tracking-wider">{res.phone_number}</td>
                      <td className="py-6 px-4 text-[10px] uppercase tracking-widest text-primary/60">{res.city}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}
