"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: number;
    prefix?: string;
    suffix?: string;
    color: "orange" | "green" | "blue" | "purple";
    delay?: number;
}

const colorClasses = {
    orange: {
        bg: "from-orange-500 to-amber-500",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        border: "border-orange-200",
    },
    green: {
        bg: "from-green-500 to-emerald-500",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        border: "border-green-200",
    },
    blue: {
        bg: "from-blue-500 to-cyan-500",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        border: "border-blue-200",
    },
    purple: {
        bg: "from-purple-500 to-pink-500",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        border: "border-purple-200",
    },
};

export default function StatsCard({
    icon: Icon,
    label,
    value,
    prefix = "",
    suffix = "",
    color,
    delay = 0,
}: StatsCardProps) {
    const [count, setCount] = useState(0);
    const colors = colorClasses[color];

    // Animated counter
    useEffect(() => {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative bg-white rounded-2xl p-6 border-2 ${colors.border} hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
        >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium uppercase tracking-wider mb-2">
                        {label}
                    </p>
                    <p className="text-4xl font-bold text-gray-900">
                        {prefix}
                        {count}
                        {suffix}
                    </p>
                </div>

                <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`${colors.iconBg} p-3 rounded-xl`}
                >
                    <Icon className={`w-6 h-6 ${colors.iconColor}`} />
                </motion.div>
            </div>

            {/* Bottom gradient line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
        </motion.div>
    );
}
