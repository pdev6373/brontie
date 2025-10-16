import nodemailer from 'nodemailer';

// Helper function to get category name from categoryId
const getCategoryName = (categoryId: string) => {
  switch (categoryId) {
    case '68483ef21d38b4b7195d45cd': return 'Cafés & Treats';
    case '68483ef21d38b4b7195d45ce': return 'Tickets & Passes';
    case '68492e4c7c523741d619abeb': return 'Dining & Meals';
    default: return 'Unknown';
  }
};

interface VoucherData {
  giftItemId: {
    name: string;
    price: number;
    merchantId: {
      name: string;
    };
  };
  senderName: string;
  recipientName: string;
  redemptionLink: string;
  status: string;
  recipientToken?: string;
}

// Create transporter
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  throw new Error('No email service configured. Please set up Gmail credentials (SMTP_USER, SMTP_PASS).');
};

// Generate payment success email HTML
const generatePaymentSuccessEmailHTML = (voucher: VoucherData, shareUrl: string) => {
  // Generate WhatsApp share URL
  const whatsappMessage = `🎁 I've sent you a gift! ${voucher.giftItemId.name} from ${voucher.giftItemId.merchantId.name}. Click here to redeem: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - Your Gift Voucher</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          background-color: #d4edda;
          color: #155724;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
        }
        .title {
          color: #2c3e50;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6c757d;
          font-size: 16px;
        }
        .details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .detail-label {
          color: #6c757d;
          font-weight: 500;
        }
        .detail-value {
          color: #2c3e50;
          font-weight: 600;
        }
        .amount {
          color: #e67e22;
          font-weight: bold;
        }
        .share-section {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .share-title {
          color: #856404;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .redemption-link {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 12px;
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
          margin-bottom: 15px;
        }
        .status-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          color: #856404;
          font-size: 14px;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .cta-button {
          display: inline-block;
          background-color: #e67e22;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 10px 5px;
        }
        .cta-button:hover {
          background-color: #d35400;
        }
        .primary-cta {
          background-color: #28a745;
          font-size: 18px;
          padding: 15px 30px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .primary-cta:hover {
          background-color: #218838;
        }
        .share-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 15px 0;
        }
        .whatsapp-btn {
          background-color: #25d366;
          color: white !important;
        }
        .whatsapp-btn:hover {
          background-color: #128c7e;
        }
        .copy-btn {
          background-color: #6c757d;
          color: white !important;
        }
        .copy-btn:hover {
          background-color: #5a6268;
        }
        .highlight-box {
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
        }
        .gift-emoji {
          font-size: 30px;
          margin-bottom: 10px;
        }
        .forward-info {
          background-color: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .forward-info h4 {
          color: #1565c0;
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .forward-info ul {
          margin: 10px 0;
          padding-left: 20px;
          color: #1976d2;
        }
        .forward-info li {
          margin-bottom: 5px;
          font-size: 14px;
        }
        .important-note {
          background-color: #fff3e0;
          border: 1px solid #ffb74d;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .important-note h4 {
          color: #ef6c00;
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        .voucher-code {
          background-color: #f3e5f5;
          border: 2px dashed #9c27b0;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          margin: 20px 0;
        }
        .voucher-code-text {
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
          color: #4a148c;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">🎁 Gift Voucher Ready!</h1>
          <p class="subtitle text-black">Your payment was successful</p>
        </div>

        ${voucher.status === 'pending' ? `
          <div class="status-notice">
            ⚠️ Payment is being processed. The voucher will be redeemable once confirmed.
          </div>
        ` : ''}

        <!-- Prominent Call-to-Action -->
        <div class="highlight-box">
          <div class="gift-emoji">🎁</div>
          <h3 style="margin: 0 0 10px 0; color: black;">Your Gift is Ready!</h3>
          <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px; color: black;">
            ${voucher.recipientName ? `Send this to ${voucher.recipientName}` : 'Share this gift voucher'}
          </p>
          <a href="${whatsappUrl}" class="cta-button whatsapp-btn">
            📱 Share via WhatsApp
          </a>
        </div>

        <div class="details">
          <h2 style="color: #2c3e50; margin-bottom: 20px;">🎁 Gift Details</h2>
          <div class="detail-row">
            <span class="detail-label">Gift Item:</span>
            <span class="detail-value">${voucher.giftItemId.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Merchant:</span>
            <span class="detail-value">${voucher.giftItemId.merchantId.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">€${voucher.giftItemId.price.toFixed(2)}</span>
          </div>
          ${voucher.senderName ? `
            <div class="detail-row">
              <span class="detail-label">From:</span>
              <span class="detail-value">${voucher.senderName}</span>
            </div>
          ` : ''}
          ${voucher.recipientName ? `
            <div class="detail-row">
              <span class="detail-label">To:</span>
              <span class="detail-value">${voucher.recipientName}</span>
            </div>
          ` : ''}
        </div>

        <!-- Important Information for Forwarding -->
        <div class="important-note">
          <h4>⚠️ Important - Please Read Before Forwarding</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #ef6c00;">
            <li><strong>Valid Until:</strong> Check with merchant for expiry date</li>
            <li><strong>One-Time Use:</strong> This voucher can only be redeemed once</li>
            <li><strong>No Cash Value:</strong> Cannot be exchanged for cash</li>
            <li><strong>Original Email:</strong> Keep this email as proof of purchase</li>
          </ul>
        </div>

        <!-- Forwarding Instructions -->
        <div class="forward-info">
          <h4>📧 Forwarding This Gift? Here's What to Include:</h4>
          <ul>
            <li><strong>Redemption Link:</strong> ${shareUrl}</li>
            <li><strong>Voucher Code:</strong> ${voucher.redemptionLink}</li>
            <li><strong>Merchant:</strong> ${voucher.giftItemId.merchantId.name}</li>
            <li><strong>Gift:</strong> ${voucher.giftItemId.name} (€${voucher.giftItemId.price.toFixed(2)})</li>
            <li><strong>From:</strong> ${voucher.senderName || 'Anonymous'}</li>
          </ul>
          <p style="margin: 10px 0 0 0; font-size: 13px; color: #1565c0; font-style: italic;">
            💡 Tip: Copy the redemption link above and include it in your message for easy access.
          </p>
        </div>

        <div class="share-section">
          <h3 class="share-title">🚀 Share Your Gift</h3>
          <p style="color: #856404; margin-bottom: 15px;">Redemption Link:</p>
          <div class="redemption-link">${shareUrl}</div>
          
          <!-- Share Buttons -->
          <div class="share-buttons">
            <a href="${whatsappUrl}" class="cta-button whatsapp-btn">
              📱 Share via WhatsApp
            </a>
            <a href="mailto:?subject=🎁 Gift for you!&body=Hi! I've sent you a gift: ${voucher.giftItemId.name} from ${voucher.giftItemId.merchantId.name}.%0D%0A%0D%0ARedemption Link: ${shareUrl}%0D%0AVoucher Code: ${voucher.redemptionLink}%0D%0A%0D%0AHow to redeem:%0D%0A1. Click the redemption link above%0D%0A2. Visit any ${voucher.giftItemId.merchantId.name} location%0D%0A3. Show the voucher code or scan the QR code%0D%0A4. Enjoy your ${voucher.giftItemId.name}!%0D%0A%0D%0AFrom: ${voucher.senderName || 'Anonymous'}" class="cta-button">
              📧 Forward via Email
            </a>
          </div>
          
          <p style="color: #856404; font-size: 14px; margin-top: 15px;">
            💡 <strong>How to redeem:</strong> The recipient visits any valid merchant location and scans the QR code on the redemption page or shows the voucher code.
          </p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${shareUrl}" class="cta-button">🎁 View Gift Voucher</a>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="cta-button">🛍️ Send Another Gift</a>
        </div>

        <!-- Instructions Section -->
        <div style="background-color: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #1565c0; margin: 0 0 10px 0;">📋 Complete Redemption Process</h4>
          <ol style="color: #1976d2; margin: 0; padding-left: 20px; font-size: 14px;">
            <li>Share the redemption link with your recipient</li>
            <li>They click the link to view their gift voucher</li>
            <li>At the merchant location, they tap "Redeem Now"</li>
            <li>They scan the merchant's QR code to complete redemption</li>
            <li>Alternatively, they can show the voucher code: <strong>${voucher.redemptionLink}</strong></li>
            <li>Enjoy! 🎉</li>
          </ol>
        </div>

        <div class="footer">
          <p><strong>Thank you for using Brontie!</strong></p>
          <p>Questions? Contact us at hello@brontie.ie</p>
          <p style="font-size: 12px; color: #999; margin-top: 15px;">
            📧 <strong>Forwarding this email?</strong> Include the redemption link and voucher code for the recipient.<br>
            🔒 This email contains your gift voucher details. Keep it safe until redeemed.<br>
            ⏰ Voucher expires according to merchant policy - check with ${voucher.giftItemId.merchantId.name} for details.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send payment success email
export const sendPaymentSuccessEmail = async (email: string, voucher: VoucherData) => {
  try {
    const transporter = createTransporter();
    
    // Generate the share URL with recipient token for viral loop
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = voucher.recipientToken 
      ? `${baseUrl}/redeem/${voucher.redemptionLink}?rt=${voucher.recipientToken}`
      : `${baseUrl}/redeem/${voucher.redemptionLink}`;
    
    // Generate email HTML
    const htmlContent = generatePaymentSuccessEmailHTML(voucher, shareUrl);
    
    await transporter.sendMail({
      from: `"Brontie" <${process.env.SMTP_USER}>`,
      to: email,
      bcc: 'kevinhoner@gmail.com',
      subject: 'Payment Successful - Your Gift Voucher is Ready!',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send payment success email:', error);
    return false;
  }
};

// Send merchant signup confirmation email
export const sendMerchantSignupEmail = async (email: string, data: { name: string; email: string }) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanks — Brontie sign-up received</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            background-color: #d4edda;
            color: #155724;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
          }
          .title {
            color: #2c3e50;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6c757d;
            font-size: 16px;
          }
          .content {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🎉 Application Received!</h1>
            <p class="subtitle">Thanks for your interest in joining Brontie</p>
          </div>

          <div class="content">
            <p>Hi ${data.name},</p>
            
            <p>Thank you for submitting your café application to Brontie! We're excited about the possibility of working together.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will review your application within 24 hours</li>
              <li>We'll check your café details and gift items</li>
              <li>You'll receive an email with our decision</li>
            </ul>
            
            <p>If approved, you'll receive:</p>
            <ul>
              <li>Login credentials for your merchant portal</li>
              <li>Instructions for setting up your locations</li>
              <li>Support to get you started</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>Questions?</strong></p>
            <p>Contact us at hello@brontie.ie</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              This email confirms your application submission. Keep it for your records.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: `"Brontie" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Thanks — Brontie sign-up received',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send merchant signup email:', error);
    return false;
  }
};

// Send admin notification email for new merchant signup
export const sendAdminNotificationEmail = async (data: {
  merchant: {
    name: string;
    email: string;
    address: string;
    description: string;
    phone: string;
    website: string;
    businessCategory: string;
  };
  giftItems: Array<{
    name: string;
    categoryId: string;
    price: number;
    description: string;
  }>;
  payout?: {
    accountHolderName: string;
    iban: string;
    bic: string;
  };
  merchantId: string;
}) => {
  try {
    const transporter = createTransporter();
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const adminUrl = `${baseUrl}/admin/merchants`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New café sign-up pending approval</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
          }
          .title {
            color: #856404;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .section-title {
            color: #2c3e50;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #6c757d;
            font-weight: 500;
          }
          .detail-value {
            color: #2c3e50;
            font-weight: 600;
          }
          .cta-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #28a745;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 0 10px;
          }
          .cta-button:hover {
            background-color: #218838;
          }
          .cta-button.secondary {
            background-color: #6c757d;
          }
          .cta-button.secondary:hover {
            background-color: #5a6268;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🏪 New Business Sign-up</h1>
            <p style="color: #856404; margin: 0;">Requires admin approval</p>
          </div>

          <div class="section">
            <h2 class="section-title">🏪 Merchant Details</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${data.merchant.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${data.merchant.email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${data.merchant.address}</span>
            </div>
            ${data.merchant.phone ? `
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${data.merchant.phone}</span>
            </div>
            ` : ''}
            ${data.merchant.website ? `
            <div class="detail-row">
              <span class="detail-label">Website:</span>
              <span class="detail-value">${data.merchant.website}</span>
            </div>
            ` : ''}
            ${data.merchant.description ? `
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${data.merchant.description}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Business Category:</span>
              <span class="detail-value">${data.merchant.businessCategory}</span>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">🎁 Gift Items (${data.giftItems.length})</h2>
            ${data.giftItems.map(item => `
              <div class="detail-row">
                <span class="detail-label">${item.name}</span>
                <span class="detail-value">€${item.price.toFixed(2)} - ${getCategoryName(item.categoryId)}</span>
              </div>
              ${item.description ? `
              <div style="color: #6c757d; font-size: 14px; margin-bottom: 8px; padding-left: 20px;">
                ${item.description}
              </div>
              ` : ''}
            `).join('')}
          </div>

          ${data.payout ? `
          <div class="section">
            <h2 class="section-title">💳 Payout Details</h2>
            <div class="detail-row">
              <span class="detail-label">Account Holder:</span>
              <span class="detail-value">${data.payout.accountHolderName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">IBAN:</span>
              <span class="detail-value">${data.payout.iban}</span>
            </div>
            ${data.payout.bic ? `
            <div class="detail-row">
              <span class="detail-label">BIC:</span>
              <span class="detail-value">${data.payout.bic}</span>
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="section">
            <h2 class="section-title">💳 Payout Details</h2>
            <p style="color: #6c757d; font-style: italic;">Payout details will be completed after approval</p>
          </div>
          `}

          <div class="cta-buttons">
            <a href="${adminUrl}" class="cta-button">
              👀 Review Application
            </a>
            <a href="${adminUrl}" class="cta-button secondary">
              📋 View All Merchants
            </a>
          </div>

          <div class="footer">
            <p><strong>Action Required:</strong> Review and approve/deny this merchant application</p>
            <p>Merchant ID: ${data.merchantId}</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              This is an automated notification from the Brontie admin system.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: `"Brontie Admin" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || 'kevinhoner@gmail.com',
      subject: 'New business sign-up pending approval',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
    return false;
  }
};

// Send merchant approval email
export const sendMerchantApprovalEmail = async (email: string, data: {
  name: string;
  tempPassword: string;
  loginUrl: string;
}) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're live on Brontie 🎉</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            background-color: #d4edda;
            color: #155724;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
          }
          .title {
            color: #28a745;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6c757d;
            font-size: 16px;
          }
          .highlight-box {
            background-color: #e3f2fd;
            border: 1px solid #90caf9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .login-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #6c757d;
            font-weight: 500;
          }
          .detail-value {
            color: #2c3e50;
            font-weight: 600;
            font-family: monospace;
          }
          .cta-button {
            display: inline-block;
            background-color: #28a745;
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 18px;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #218838;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">🎉 You're Live on Brontie!</h1>
            <p class="subtitle">Your café has been approved and is now visible to customers</p>
          </div>

          <div class="highlight-box">
            <h3 style="color: #1565c0; margin: 0 0 15px 0;">🚀 What's Next?</h3>
            <ul style="color: #1976d2; margin: 0; padding-left: 20px;">
              <li>Complete your payment details in your dashboard</li>
              <li>Set up your merchant locations</li>
              <li>Configure your gift items</li>
              <li>Start receiving orders from customers</li>
              <li>Manage your payouts and settings</li>
            </ul>
          </div>

          <div class="login-details">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0;">🔑 Your Login Credentials</h3>
            <div class="detail-row">
              <span class="detail-label">Login URL:</span>
              <span class="detail-value">${data.loginUrl}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Temporary Password:</span>
              <span class="detail-value">${data.tempPassword}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${data.loginUrl}" class="cta-button">
              🚀 Access Your Merchant Portal
            </a>
          </div>

          <div style="background-color: #e8f5e8; border: 1px solid #c3e6c3; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">💳 Complete Your Payment Details</h4>
            <p style="color: #155724; margin: 0; font-size: 14px;">
              Don't forget to add your bank account details (IBAN, BIC) in your dashboard to receive payouts from customer purchases.
            </p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important Security Note</h4>
            <p style="color: #856404; margin: 0; font-size: 14px;">
              Please change your temporary password after your first login for security.
            </p>
          </div>

          <div class="footer">
            <p><strong>Welcome to the Brontie family!</strong></p>
            <p>Questions? Contact us at hello@brontie.ie</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              Your café is now live and customers can start purchasing gift vouchers.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: `"Brontie" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'You\'re live on Brontie 🎉',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send merchant approval email:', error);
    return false;
  }
};

// Send merchant denial email
export const sendMerchantDenialEmail = async (email: string, data: {
  name: string;
  reason?: string;
}) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Brontie Application Update</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .icon {
            background-color: #f8d7da;
            color: #721c24;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
          }
          .title {
            color: #721c24;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6c757d;
            font-size: 16px;
          }
          .content {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Application Update</h1>
            <p class="subtitle">Thank you for your interest in Brontie</p>
          </div>

          <div class="content">
            <p>Hi ${data.name},</p>
            
            <p>Thank you for your interest in joining Brontie as a merchant partner. After careful review of your application, we regret to inform you that we are unable to approve your café for our platform at this time.</p>
            
            ${data.reason ? `
            <p><strong>Feedback:</strong></p>
            <p style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; color: #856404;">
              ${data.reason}
            </p>
            ` : ''}
            
            <p>This decision is not necessarily final, and we encourage you to:</p>
            <ul>
              <li>Review the feedback provided</li>
              <li>Address any areas of concern</li>
              <li>Consider reapplying in the future</li>
            </ul>
            
            <p>We appreciate your understanding and wish you the best of luck with your café business.</p>
          </div>

          <div class="footer">
            <p><strong>Questions?</strong></p>
            <p>Contact us at hello@brontie.ie</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              Thank you for considering Brontie as your gifting platform partner.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: `"Brontie" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Brontie Application Update',
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send merchant denial email:', error);
    return false;
  }
};

// Generic email sending function
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Brontie" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};