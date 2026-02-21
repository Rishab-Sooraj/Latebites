import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
    title: "Privacy Policy — Latebites",
    description:
        "Learn how Latebites collects, uses, and protects your personal data in accordance with applicable Indian privacy laws.",
};

const sections = [
    {
        number: "1",
        title: "Introduction",
        content: `Latebites ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, who we share it with, and your rights in relation to it.

By using the Latebites platform — including our website, mobile applications, and related services — you consent to the practices described in this policy. If you do not agree, please discontinue use of the Platform.`,
    },
    {
        number: "2",
        title: "Information We Collect",
        content: `We collect the following categories of personal data:

Account Information
• Full name, email address, and phone number when you register.
• Password (stored in encrypted form — we never access it in plaintext).

Order and Transaction Data
• Details of bags reserved, pickup times, order amounts, and payment references.
• We do not store card numbers, CVVs, or banking credentials — these are handled exclusively by our third-party payment providers.

Location Data
• Approximate location (city/area level) to show nearby restaurants on the browse page.
• We do not track your live GPS location in the background.

Device and Usage Data
• Browser type, IP address, device identifiers, pages visited, and interaction logs — for performance monitoring and security.

Support Communications
• Messages exchanged with our support team, including issue type and order context.

Restaurant Partner Data
• Business name, FSSAI registration, contact details, bank account information for payout settlements.`,
    },
    {
        number: "3",
        title: "How We Use Your Information",
        content: `We use your data solely for the following purposes:

• Creating and managing your account
• Processing orders and coordinating pickups
• Sending order confirmations, OTPs, and pickup reminders
• Processing payments and restaurant payouts
• Responding to support queries
• Detecting and preventing fraud or abuse
• Improving platform performance and user experience
• Complying with legal obligations

We do not use your personal data for unsolicited advertising or sell it to third parties for marketing purposes.`,
    },
    {
        number: "4",
        title: "Legal Basis for Processing",
        content: `We process your data on the following legal grounds:

• Contractual necessity — to fulfill your orders and maintain your account.
• Legitimate interests — to operate the platform securely, prevent fraud, and improve our services.
• Legal obligation — to comply with applicable Indian law, including GST, financial record-keeping, and consumer protection rules.
• Consent — where you have explicitly opted in, such as receiving marketing communications.`,
    },
    {
        number: "5",
        title: "Data Sharing and Disclosure",
        content: `We share personal data only in the following limited circumstances:

Restaurants
Restaurants receive your first name, order summary, and pickup OTP to facilitate your collection. They do not receive your full contact details unless required for the transaction.

Payment Processors
We use third-party gateways (such as Razorpay) to process payments. These processors operate under their own privacy policies and PCI-DSS compliance obligations.

Service Providers
We may engage trusted service providers (e.g., for email delivery, cloud hosting, analytics) who process data solely on our behalf under strict confidentiality agreements.

Legal Requirements
We may disclose data if required by law, court order, or to protect the rights, safety, or property of Latebites or the public.

Business Transfers
In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of that transaction with appropriate notice.

We do not sell, rent, or trade your personal data to any third party.`,
    },
    {
        number: "6",
        title: "Data Retention",
        content: `We retain your personal data for as long as:

• Your account remains active.
• It is required to fulfill legal, accounting, or reporting obligations (typically 7 years for financial records under Indian law).
• It is necessary to resolve disputes or enforce our agreements.

When data is no longer needed, we delete or anonymise it securely.`,
    },
    {
        number: "7",
        title: "Cookies and Tracking Technologies",
        content: `We use cookies and similar technologies to:

• Maintain your login session
• Remember your preferences
• Understand how users navigate the Platform (analytics)
• Improve Platform stability and performance

You can control cookie settings through your browser. Note that disabling certain cookies may affect Platform functionality.`,
    },
    {
        number: "8",
        title: "Data Security",
        content: `We implement appropriate technical and organisational measures to protect your data, including:

• Encrypted data transmission (HTTPS/TLS)
• Secure, encrypted credential storage
• Row-level security on our database
• Access controls limiting who within Latebites can access personal data
• Regular security reviews

However, no system is 100% secure. We cannot guarantee absolute security against all threats.`,
    },
    {
        number: "9",
        title: "Children's Privacy",
        content: `Latebites is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has provided personal information, we will delete it promptly.`,
    },
    {
        number: "10",
        title: "Your Rights",
        content: `Depending on applicable law, you may have the following rights:

• Access — request a copy of the personal data we hold about you.
• Correction — request correction of inaccurate or incomplete data.
• Deletion — request erasure of your personal data (subject to legal retention requirements).
• Portability — receive your data in a structured, machine-readable format.
• Objection — object to certain types of processing.
• Withdrawal of Consent — where processing is based on consent, you may withdraw it at any time.

To exercise any of these rights, contact us at support@latebites.in. We will respond within 30 days.`,
    },
    {
        number: "11",
        title: "Third-Party Links",
        content: `The Platform may contain links to third-party websites or services (e.g., social media). We are not responsible for the privacy practices of those third parties. We encourage you to read their privacy policies before sharing any personal information.`,
    },
    {
        number: "12",
        title: "International Data Transfers",
        content: `Our primary infrastructure is hosted in India. Some of our service providers may process data outside India. Where such transfers occur, we ensure appropriate safeguards are in place consistent with applicable data protection law.`,
    },
    {
        number: "13",
        title: "Changes to This Policy",
        content: `We may update this Privacy Policy periodically. When changes are material, we will notify users via email or a prominent notice on the Platform. The "Last updated" date at the top of this page will always reflect the most recent revision.

Continued use of the Platform after changes constitutes acceptance of the updated policy.`,
    },
    {
        number: "14",
        title: "Grievance Officer",
        content: `In accordance with the Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, users may contact our Grievance Officer for any privacy-related concerns:

Name: Latebites Support Team
Email: support@latebites.in
Response time: Within 30 days of receipt`,
    },
    {
        number: "15",
        title: "Governing Law",
        content: `This Privacy Policy is governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Tamil Nadu.`,
    },
    {
        number: "16",
        title: "Contact Us",
        content: `For any privacy-related questions, data requests, or concerns:

Email: support@latebites.in
Business address: Coimbatore, Tamil Nadu, India`,
    },
];

export default function PrivacyPage() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-[#4A5D4D] font-light leading-relaxed">
                        Last updated: February 2026 &middot; Coimbatore, Tamil Nadu, India
                    </p>
                    <div className="mt-8 p-5 bg-[#0B1E0F]/4 border border-[#0B1E0F]/8 rounded-xl">
                        <p className="text-sm text-[#4A5D4D] font-light leading-relaxed">
                            We take your privacy seriously. This policy explains how Latebites collects, uses,
                            and protects your personal information. For questions, contact{" "}
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
                        <Link href="/terms" className="hover:text-[#0B1E0F] transition-colors">
                            Terms &amp; Conditions
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
