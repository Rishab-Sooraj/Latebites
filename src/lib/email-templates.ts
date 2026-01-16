// Email Templates for Latebites

// Common styles
const commonStyles = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #0a0a0a;
    color: #ffffff;
`;

const headerStyle = `
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    padding: 30px;
    text-align: center;
`;

const footerStyle = `
    padding: 20px;
    text-align: center;
    color: #71717a;
    font-size: 12px;
    border-top: 1px solid #27272a;
`;

// 1. Email Confirmation Template (when restaurant submits onboarding form)
export function getOnboardingConfirmationEmail(restaurantName: string, contactPerson: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="${commonStyles}">
        <div style="${headerStyle}">
            <h1 style="margin: 0; color: #000000; font-size: 24px;">🍽️ Latebites</h1>
        </div>
        <div style="padding: 40px 30px;">
            <h2 style="color: #f59e0b; margin-top: 0;">Application Received!</h2>
            <p style="color: #e4e4e7; line-height: 1.6;">
                Dear <strong>${contactPerson}</strong>,
            </p>
            <p style="color: #a1a1aa; line-height: 1.6;">
                Thank you for applying to partner with Latebites! We have received the onboarding application for <strong style="color: #ffffff;">${restaurantName}</strong>.
            </p>
            <div style="background-color: #18181b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #f59e0b; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">What happens next?</h3>
                <ol style="color: #a1a1aa; line-height: 1.8; padding-left: 20px; margin: 0;">
                    <li>Our team will review your application</li>
                    <li>We may visit your restaurant for verification</li>
                    <li>Once approved, you'll receive your login credentials</li>
                </ol>
            </div>
            <p style="color: #71717a; font-size: 14px;">
                This usually takes 2-3 business days. We'll keep you updated!
            </p>
        </div>
        <div style="${footerStyle}">
            <p style="margin: 0;">© ${new Date().getFullYear()} Latebites. Fighting food waste, one meal at a time.</p>
            <p style="margin: 10px 0 0 0;">Coimbatore, Tamil Nadu, India</p>
        </div>
    </body>
    </html>
    `;
}
