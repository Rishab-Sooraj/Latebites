// Email service using Resend
import { Resend } from 'resend';

interface EmailOptions {
    to: { email: string; name?: string }[];
    from: {
        address: string;
        name: string;
    };
    subject: string;
    htmlBody: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error('RESEND_API_KEY is not set');
        return { success: false, error: 'Email configuration missing' };
    }

    try {
        const resend = new Resend(apiKey);

        const toAddresses = options.to.map(r => r.name ? `${r.name} <${r.email}>` : r.email);

        const { error } = await resend.emails.send({
            from: `${options.from.name} <${options.from.address}>`,
            to: toAddresses,
            subject: options.subject,
            html: options.htmlBody,
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Email sent successfully');
        return { success: true };
    } catch (err: any) {
        console.error('Email send error:', err);
        return { success: false, error: err?.message || 'Failed to send email' };
    }
}

// Sender addresses
export const SENDERS = {
    onboarding: {
        address: 'noreply@latebites.in',
        name: 'Latebites Onboarding',
    },
    noreply: {
        address: 'noreply@latebites.in',
        name: 'Latebites',
    },
    orderConfirmation: {
        address: 'order_confirmation@latebites.in',
        name: 'Latebites Orders',
    },
};
