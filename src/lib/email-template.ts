export function generateVerificationEmail(
  restaurantName: string,
  contactPerson: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Latebites</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F0E8;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #2D4A3E;">
              <h1 style="margin: 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 32px; font-weight: 300; color: #F5F0E8; letter-spacing: 0.05em;">
                Latebites
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; color: #F5F0E8; opacity: 0.8;">
                Food Rescue Initiative
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 300; color: #1a1a1a; line-height: 1.3;">
                Welcome, ${contactPerson}!
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                Thank you for your interest in joining <strong>Latebites</strong> and our food rescue mission. We're excited to have <strong>${restaurantName}</strong> on board!
              </p>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">
                To complete your onboarding request, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background-color: #2D4A3E; color: #F5F0E8; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3em; border-radius: 2px; font-weight: 500;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #6a6a6a;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; font-size: 13px; line-height: 1.6; color: #2D4A3E; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 30px; margin-top: 30px;">
                <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #4a4a4a;">
                  <strong>What happens next?</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #6a6a6a;">
                  <li>Your email will be verified</li>
                  <li>Our team will review your application</li>
                  <li>We'll contact you within 2-3 business days</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px; font-size: 12px; line-height: 1.6; color: #6a6a6a; text-align: center;">
                <em>"Surplus is a gift, not a burden."</em>
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #999; text-align: center;">
                © ${new Date().getFullYear()} Latebites. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
