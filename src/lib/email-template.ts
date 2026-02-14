// Email templates for various events

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #000000;
  color: #ffffff;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const headerStyle = `
  text-align: center;
  margin-bottom: 40px;
`;

const logoStyle = `
  font-family: Georgia, serif;
  font-size: 32px;
  color: #FF6B00;
  margin: 0;
  letter-spacing: 0.05em;
`;

const contentStyle = `
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 40px;
  border: 1px solid #333;
`;

const buttonStyle = `
  display: inline-block;
  padding: 14px 32px;
  background-color: #FF6B00;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 20px 0;
`;

export function generateRestaurantVerificationEmail(
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
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">Latebites</h1>
      <p style="color: #999; font-size: 14px; margin-top: 8px;">Food Rescue Initiative</p>
    </div>
    
    <div style="${contentStyle}">
      <h2 style="color: #FF6B00; margin-top: 0;">Welcome, ${contactPerson}!</h2>
      
      <p style="line-height: 1.6; color: #ccc;">
        Thank you for your interest in joining <strong>Latebites</strong> and our food rescue mission. 
        We're excited to have <strong>${restaurantName}</strong> on board!
      </p>
      
      <p style="line-height: 1.6; color: #ccc;">
        To complete your onboarding request, please verify your email address:
      </p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" style="${buttonStyle}">Verify Email Address</a>
      </div>
      
      <p style="font-size: 14px; color: #999; margin-top: 30px;">
        Or copy and paste this link: <br>
        <span style="color: #FF6B00; word-break: break-all;">${verificationUrl}</span>
      </p>
      
      <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #ccc;"><strong>What happens next?</strong></p>
      <ul style="color: #999; line-height: 1.8;">
        <li>Your email will be verified</li>
        <li>Our team will review your application</li>
        <li>We'll contact you within 2-3 business days</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
      <p><em>"Surplus is a gift, not a burden."</em></p>
      <p>© ${new Date().getFullYear()} Latebites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateOrderConfirmationEmail(
  customerName: string,
  orderId: string,
  restaurantName: string,
  items: Array<{ title: string; quantity: number; price: number }>,
  totalPrice: number,
  pickupTime: string,
  pickupAddress: string,
  otp: string
): string {
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 10px 0; color: #ccc;">${item.title} x${item.quantity}</td>
      <td style="padding: 10px 0; color: #ccc; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">Latebites</h1>
      <p style="color: #999; font-size: 14px; margin-top: 8px;">Order Confirmation</p>
    </div>
    
    <div style="${contentStyle}">
      <h2 style="color: #FF6B00; margin-top: 0;">Order Confirmed! 🎉</h2>
      
      <p style="line-height: 1.6; color: #ccc;">
        Hi <strong>${customerName}</strong>,
      </p>
      
      <p style="line-height: 1.6; color: #ccc;">
        Your order has been confirmed! Here are your order details:
      </p>
      
      <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #999; margin: 0; font-size: 12px;">ORDER ID</p>
        <p style="color: #FF6B00; margin: 5px 0 0; font-size: 18px; font-weight: 600;">#${orderId}</p>
      </div>
      
      <h3 style="color: #fff; font-size: 16px;">Restaurant</h3>
      <p style="color: #ccc;">${restaurantName}</p>
      
      <h3 style="color: #fff; font-size: 16px;">Your Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsList}
        <tr style="border-top: 1px solid #333;">
          <td style="padding: 15px 0; color: #fff; font-weight: 600;">Total</td>
          <td style="padding: 15px 0; color: #FF6B00; font-weight: 600; text-align: right; font-size: 18px;">₹${totalPrice.toFixed(2)}</td>
        </tr>
      </table>
      
      <h3 style="color: #fff; font-size: 16px; margin-top: 30px;">Pickup Details</h3>
      <p style="color: #ccc; margin: 5px 0;"><strong>Time:</strong> ${pickupTime}</p>
      <p style="color: #ccc; margin: 5px 0;"><strong>Address:</strong> ${pickupAddress}</p>
      
      <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">YOUR PICKUP OTP</p>
        <p style="color: #FF6B00; margin: 10px 0 0; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${otp}</p>
        <p style="color: #666; margin: 10px 0 0; font-size: 12px;">Show this code at pickup</p>
      </div>
      
      <p style="font-size: 14px; color: #999; line-height: 1.6;">
        Thank you for helping us reduce food waste! 🌱
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Latebites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateOrderCancellationEmail(
  customerName: string,
  orderId: string,
  restaurantName: string,
  refundAmount: number,
  reason?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">Latebites</h1>
      <p style="color: #999; font-size: 14px; margin-top: 8px;">Order Cancellation</p>
    </div>
    
    <div style="${contentStyle}">
      <h2 style="color: #FF6B00; margin-top: 0;">Order Cancelled</h2>
      
      <p style="line-height: 1.6; color: #ccc;">
        Hi <strong>${customerName}</strong>,
      </p>
      
      <p style="line-height: 1.6; color: #ccc;">
        Your order <strong>#${orderId}</strong> from <strong>${restaurantName}</strong> has been cancelled.
      </p>
      
      ${reason ? `
      <div style="background-color: #0a0a0a; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #999; margin: 0; font-size: 12px;">CANCELLATION REASON</p>
        <p style="color: #ccc; margin: 10px 0 0;">${reason}</p>
      </div>
      ` : ''}
      
      ${refundAmount > 0 ? `
      <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #999; margin: 0; font-size: 12px;">REFUND AMOUNT</p>
        <p style="color: #4ade80; margin: 10px 0 0; font-size: 24px; font-weight: 600;">₹${refundAmount.toFixed(2)}</p>
        <p style="color: #666; margin: 10px 0 0; font-size: 12px;">Refund will be processed within 5-7 business days</p>
      </div>
      ` : ''}
      
      <p style="font-size: 14px; color: #999; line-height: 1.6;">
        We hope to serve you again soon!
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Latebites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateRefundProcessedEmail(
  customerName: string,
  orderId: string,
  refundAmount: number,
  refundId: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${baseStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">Latebites</h1>
      <p style="color: #999; font-size: 14px; margin-top: 8px;">Refund Processed</p>
    </div>
    
    <div style="${contentStyle}">
      <h2 style="color: #4ade80; margin-top: 0;">Refund Successful ✓</h2>
      
      <p style="line-height: 1.6; color: #ccc;">
        Hi <strong>${customerName}</strong>,
      </p>
      
      <p style="line-height: 1.6; color: #ccc;">
        Your refund for order <strong>#${orderId}</strong> has been processed successfully.
      </p>
      
      <div style="background-color: #0a0a0a; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #999; margin: 0; font-size: 12px;">REFUND AMOUNT</p>
        <p style="color: #4ade80; margin: 10px 0; font-size: 28px; font-weight: 600;">₹${refundAmount.toFixed(2)}</p>
        <p style="color: #999; margin: 0; font-size: 12px;">REFUND ID</p>
        <p style="color: #666; margin: 5px 0 0; font-size: 14px;">${refundId}</p>
      </div>
      
      <p style="font-size: 14px; color: #999; line-height: 1.6;">
        The refund will appear in your account within 5-7 business days depending on your bank.
      </p>
      
      <p style="font-size: 14px; color: #999; line-height: 1.6;">
        If you have any questions, please contact our support team.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Latebites. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
