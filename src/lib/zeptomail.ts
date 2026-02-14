// ZeptoMail email service
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
    const apiKey = process.env.ZEPTOMAIL_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ ZEPTOMAIL_API_KEY not configured - email sending skipped');
        return false;
    }

    try {
        const response = await fetch('https://api.zeptomail.in/v1.1/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
            },
            body: JSON.stringify({
                from: {
                    address: options.from?.email || 'noreply@latebites.in',
                    name: options.from?.name || 'Latebites',
                },
                to: [
                    {
                        email_address: {
                            address: options.to,
                        },
                    },
                ],
                subject: options.subject,
                htmlbody: options.html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ ZeptoMail error:', error);
            return false;
        }

        console.log('✅ Email sent successfully to:', options.to);
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}
