import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Terms & Conditions — Latebites",
    description:
        "Read the Terms and Conditions governing your use of the Latebites platform, including our marketplace rules, refund policy, and liability limitations.",
};

const sections = [
    {
        number: "1",
        title: "Introduction and Acceptance of Terms",
        content: `These Terms and Conditions ("Terms") govern access to and use of the Latebites platform, including its website, mobile applications, and any related services (collectively referred to as the "Platform").

By accessing or using Latebites, whether as a customer or restaurant partner, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree to any part of these Terms, you must immediately discontinue use of the Platform.

Latebites reserves the right to update these Terms at any time. Continued usage of the Platform after any modifications constitutes acceptance of the revised Terms.`,
    },
    {
        number: "2",
        title: "Nature of the Platform",
        content: `Latebites operates exclusively as a technology marketplace designed to facilitate the discovery and reservation of surplus end-of-day food offered by independent restaurants.

Latebites does not prepare food, store food, transport food, package food, or deliver food. Latebites does not inspect restaurant kitchens, certify hygiene practices, or verify ingredient quality.

All food is prepared, handled, and handed over solely by participating restaurants. Customers enter into a direct transaction with the restaurant upon purchase. Latebites provides only the digital infrastructure enabling such transactions.

Latebites is not a food service provider, distributor, caterer, or logistics operator.`,
    },
    {
        number: "3",
        title: "Definitions",
        content: `For the purposes of these Terms:

"Customer" refers to any individual reserving food through Latebites.
"Restaurant" refers to any food business registered on the Platform.
"Bag" refers to a surplus food bundle whose contents are unpredictable and depend on end-of-day availability.
"Pickup" refers to in-person collection of food from the restaurant within a defined time window.`,
    },
    {
        number: "4",
        title: "Eligibility and User Representation",
        content: `Users must be at least eighteen (18) years old and possess legal capacity to enter binding agreements.

By using Latebites, customers confirm that they meet these eligibility requirements. Restaurants confirm that they hold valid licenses and permits required to operate legally, including compliance with FSSAI and applicable local regulations.

Latebites reserves the right to refuse access or terminate accounts that fail to meet eligibility criteria.`,
    },
    {
        number: "5",
        title: "Account Registration and Responsibility",
        content: `Users are responsible for maintaining the confidentiality of their account credentials. Any activity performed through a registered account is deemed to be authorized by the account holder.

Latebites shall not be responsible for losses arising from unauthorized access caused by user negligence.

Accounts may not be transferred or shared.`,
    },
    {
        number: "6",
        title: "Nature of Bags and Customer Acknowledgement",
        content: `Customers explicitly acknowledge that Bags offered through Latebites consist of surplus food whose contents vary daily.

Customers understand that:
• Individual food items cannot be selected
• Portion sizes may vary
• Value is approximate and based on menu pricing
• Availability is limited
• Pickup timing is fixed

Customers accept uncertainty as an essential feature of the Latebites experience.`,
    },
    {
        number: "7",
        title: "Pricing, Payments, and Fees",
        content: `Customers pay the displayed bag price plus a platform service fee.

Payments are processed through third-party payment gateways. Latebites does not store card details or control gateway operations.

Restaurants are charged commission on completed orders.

Latebites is not liable for transaction failures, banking delays, or third-party payment disruptions.`,
    },
    {
        number: "8",
        title: "Restaurant Payouts and Settlement",
        content: `Restaurant payouts are processed automatically following completed pickups, subject to applicable deductions.

Settlement timelines may vary based on banking infrastructure and payment providers.

Latebites does not guarantee instant payouts and shall not be held responsible for external processing delays.`,
    },
    {
        number: "9",
        title: "Pickup Obligations",
        content: `Customers must arrive within the specified pickup window.

Failure to collect within this window results in forfeiture without refund.

Restaurants are not required to hold food beyond the pickup window.

Latebites bears no responsibility for missed pickups.`,
    },
    {
        number: "10",
        title: "Refund Policy",
        content: `Refunds may be issued in cases of restaurant cancellation, non-fulfillment, significant deviation from declared value, or incorrect Veg/Non-Veg classification.

Refund eligibility is determined solely by Latebites.

Missed pickups by customers are non-refundable.

Latebites retains final authority over refund decisions.`,
    },
    {
        number: "11",
        title: "Food Safety Disclaimer",
        content: `Latebites does not guarantee freshness, taste, hygiene, ingredient accuracy, or allergen safety.

Restaurants remain solely responsible for food preparation and handling.

Customers consume food entirely at their own risk.`,
    },
    {
        number: "12",
        title: "Medical and Dietary Disclaimer",
        content: `Latebites makes no medical, nutritional, or dietary representations.

Customers are responsible for verifying suitability for allergies, intolerances, or health conditions.

Latebites assumes no liability for adverse health outcomes.`,
    },
    {
        number: "13",
        title: "Limitation of Liability",
        content: `Latebites shall not be liable for illness, allergic reactions, dissatisfaction, restaurant misconduct, or post-pickup handling.

Platform liability is strictly limited to the amount paid for the affected order.

Indirect or consequential damages are excluded.`,
    },
    {
        number: "14",
        title: "Indemnification",
        content: `Users agree to indemnify and hold harmless Latebites from claims arising from misuse of the Platform, food consumption, restaurant negligence, or violation of these Terms.`,
    },
    {
        number: "15",
        title: "Reliability Monitoring and Enforcement",
        content: `Latebites operates internal reliability systems to monitor behavior.

Restaurants and customers engaging in repeated violations may face reduced visibility, suspension, or permanent removal.

Enforcement decisions are final.`,
    },
    {
        number: "16",
        title: "Account Suspension and Termination",
        content: `Latebites may suspend or terminate accounts for fraud, abuse, misrepresentation, or repeated non-compliance.

Suspension may occur without prior notice.`,
    },
    {
        number: "17",
        title: "Intellectual Property",
        content: `All platform software, branding, and content remain property of Latebites.

Unauthorized use is prohibited.`,
    },
    {
        number: "18",
        title: "Data Collection and Privacy",
        content: `Latebites collects data for authentication, transactions, communication, and operational improvement.

Personal data is handled in accordance with applicable laws. Please refer to our Privacy Policy for full details.`,
    },
    {
        number: "19",
        title: "Force Majeure",
        content: `Latebites is not liable for service disruption caused by events beyond reasonable control including natural disasters, strikes, government actions, or network failures.`,
    },
    {
        number: "20",
        title: "Modifications to Terms",
        content: `Latebites may update Terms without prior notice.

Continued use implies acceptance.`,
    },
    {
        number: "21",
        title: "Entire Agreement",
        content: `These Terms constitute the entire agreement between users and Latebites.`,
    },
    {
        number: "22",
        title: "Severability",
        content: `Invalid provisions do not affect remaining clauses.`,
    },
    {
        number: "23",
        title: "Governing Law and Jurisdiction",
        content: `These Terms are governed by Indian law.

Jurisdiction lies exclusively in Tamil Nadu.`,
    },
    {
        number: "24",
        title: "Survival",
        content: `Clauses relating to liability, indemnification, and jurisdiction survive termination.`,
    },
    {
        number: "25",
        title: "Contact Information",
        content: `For legal inquiries: support@latebites.in`,
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#F7F4EB] text-[#0B1E0F] selection:bg-[#0B1E0F] selection:text-[#F7F4EB]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#F7F4EB]/90 backdrop-blur-md border-b border-[#0B1E0F]/8">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-[#4A5D4D] hover:text-[#0B1E0F] transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Latebites
                    </Link>
                    <Link href="/" className="flex items-center gap-2.5">
                        <img
                            src="/images/latebites-logo.jpg"
                            alt="Latebites"
                            className="w-6 h-6 object-contain"
                        />
                        <span className="font-serif italic text-base text-[#0B1E0F]/70">Latebites</span>
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
                {/* Title block */}
                <div className="mb-14 sm:mb-16">
                    <p className="text-xs tracking-[0.25em] uppercase text-[#4A5D4D]/50 mb-4 font-medium">
                        Legal
                    </p>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light leading-[1.1] mb-6">
                        Terms &amp; Conditions
                    </h1>
                    <p className="text-sm text-[#4A5D4D] font-light leading-relaxed">
                        Last updated: February 2026 &middot; Effective immediately upon use of the Platform.
                    </p>
                    <div className="mt-8 p-5 bg-[#0B1E0F]/4 border border-[#0B1E0F]/8 rounded-xl">
                        <p className="text-sm text-[#4A5D4D] font-light leading-relaxed">
                            By using Latebites, you agree to these Terms in full. If you disagree with any part,
                            please discontinue use immediately. For questions, contact{" "}
                            <a
                                href="mailto:support@latebites.in"
                                className="text-[#0B1E0F] underline underline-offset-2"
                            >
                                support@latebites.in
                            </a>
                            .
                        </p>
                    </div>
                </div>

                {/* Table of Contents */}
                <nav className="mb-14 p-6 bg-white/60 border border-[#D1CEC2]/80 rounded-2xl">
                    <p className="text-xs tracking-[0.2em] uppercase text-[#4A5D4D]/60 mb-4 font-medium">
                        Contents
                    </p>
                    <ol className="space-y-1.5">
                        {sections.map((s) => (
                            <li key={s.number}>
                                <a
                                    href={`#section-${s.number}`}
                                    className="text-sm text-[#4A5D4D] hover:text-[#0B1E0F] transition-colors font-light flex gap-3"
                                >
                                    <span className="text-[#0B1E0F]/30 font-mono tabular-nums w-6 flex-shrink-0">
                                        {s.number}.
                                    </span>
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                {/* Sections */}
                <div className="space-y-12 sm:space-y-14">
                    {sections.map((s) => (
                        <section key={s.number} id={`section-${s.number}`} className="scroll-mt-24">
                            <div className="flex gap-5 items-start mb-4">
                                <span className="text-xs font-mono text-[#4A5D4D]/40 pt-1.5 flex-shrink-0 tabular-nums">
                                    {s.number}.
                                </span>
                                <h2 className="text-xl sm:text-2xl font-serif font-light">{s.title}</h2>
                            </div>
                            <div className="pl-8 sm:pl-10">
                                {s.content.split("\n\n").map((para, i) => (
                                    <p
                                        key={i}
                                        className="text-sm sm:text-[0.9rem] text-[#4A5D4D] font-light leading-relaxed mb-4 last:mb-0 whitespace-pre-line"
                                    >
                                        {para}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-8 border-b border-[#0B1E0F]/6" />
                        </section>
                    ))}
                </div>

                {/* Footer note */}
                <div className="mt-16 pt-10 border-t border-[#0B1E0F]/8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <p className="text-xs text-[#4A5D4D]/50 font-light">
                        © 2025 Latebites · Coimbatore, India
                    </p>
                    <div className="flex gap-5 text-xs text-[#4A5D4D]/50">
                        <Link href="/privacy" className="hover:text-[#0B1E0F] transition-colors">
                            Privacy Policy
                        </Link>
                        <a href="mailto:support@latebites.in" className="hover:text-[#0B1E0F] transition-colors">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
