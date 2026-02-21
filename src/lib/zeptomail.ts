// Email service using Resend
import { Resend } from 'resend';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: {
        name: string;
        email: string;
    };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ RESEND_API_KEY not configured - email sending skipped');
        return false;
    }

    try {
        const resend = new Resend(apiKey);

        const fromName = options.from?.name || 'Latebites';
        const fromEmail = options.from?.email || 'noreply@latebites.in';

        const { error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [options.to],
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error('❌ Resend error:', error);
            return false;
        }

        console.log('✅ Email sent successfully to:', options.to);
        return true;
    } catch (err) {
        console.error('❌ Failed to send email:', err);
        return false;
    }
}
