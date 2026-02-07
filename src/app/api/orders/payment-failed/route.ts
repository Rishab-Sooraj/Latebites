import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
    try {
        const { customerEmail, customerName, orderId, reason } = await request.json();

        if (!resend) {
            console.log("⚠️ Resend not configured, skipping email");
            return NextResponse.json({ success: false, message: 'Email service not configured' });
        }

        if (!customerEmail) {
            return NextResponse.json({ success: false, message: 'No email provided' });
        }

        await resend.emails.send({
            from: 'Latebites <support@latebites.in>',
            to: customerEmail,
            subject: "😅 Oops! Your payment didn't go through",
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;">
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                        <div style="font-size: 64px; margin-bottom: 10px;">🙈</div>
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Payment Didn't Go Through</h1>
                    </div>
                    
                    <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                        <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Hey ${customerName || 'there'}! 👋</p>
                        
                        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                            Looks like your payment couldn't be completed. Don't worry - your mystery bag hasn't gone anywhere! It's still waiting for you. 🍔
                        </p>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin: 25px 0;">
                            <p style="margin: 0; color: #92400e; font-weight: 500;">💡 What you can do:</p>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #78716c;">
                                <li>Try again with a different payment method</li>
                                <li>Check if your card has sufficient balance</li>
                                <li>Make sure your UPI app is updated</li>
                                <li>Or simply choose "Pay at Pickup" 🏃‍♂️</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://latebites.in/cart" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                                Try Again 💪
                            </a>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            Every bag you rescue is a win for the planet! 🌍💚<br/>
                            <span style="font-style: italic;">- Team Latebites</span>
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`📧 Payment failure email sent to: ${customerEmail}`);
        return NextResponse.json({ success: true, message: 'Email sent' });
    } catch (error: any) {
        console.error('Payment failure email error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
