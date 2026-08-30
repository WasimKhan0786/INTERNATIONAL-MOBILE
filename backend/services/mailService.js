const nodemailer = require('nodemailer');

/**
 * Helper to construct the SMTP transporter dynamically
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Return null if SMTP is unconfigured to enable console logging dry-run fallback
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // True for 465, false for 587 or others
    auth: {
      user,
      pass
    }
  });
};

/**
 * Helper to construct status badges with corresponding styling
 */
const getStatusBadgeHtml = (status) => {
  const normStatus = (status || 'Pending').trim().toLowerCase();
  let bgColor = '#fffae6';
  let textColor = '#b7791f';
  let label = 'PENDING';

  switch (normStatus) {
    case 'delivered':
      bgColor = '#e6f4ea';
      textColor = '#137333';
      label = 'DELIVERED';
      break;
    case 'cancelled':
      bgColor = '#fce8e6';
      textColor = '#c5221f';
      label = 'CANCELLED';
      break;
    case 'confirmed':
      bgColor = '#e8f0fe';
      textColor = '#1a73e8';
      label = 'CONFIRMED';
      break;
    case 'processing':
      bgColor = '#e0f2fe';
      textColor = '#0369a1';
      label = 'PROCESSING';
      break;
    case 'shipped':
      bgColor = '#f3e8ff';
      textColor = '#6b21a8';
      label = 'SHIPPED';
      break;
    case 'pending':
    default:
      bgColor = '#fffae6';
      textColor = '#b7791f';
      label = 'PENDING';
      break;
  }

  return `<span style="background-color: ${bgColor}; color: ${textColor}; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${label}</span>`;
};

/**
 * Generate a beautifully formatted HTML template for order payment notifications
 */
const generatePaymentRequestTemplate = (order) => {
  const itemsHtml = order.products.map(item => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-size: 0.9rem; color: #2d3748;">
        <strong>${item.name}</strong><br>
        <span style="font-size: 0.75rem; color: #718096;">Brand: ${item.brand} ${item.sku ? `| SKU: ${item.sku}` : ''}</span>
      </td>
      <td style="padding: 10px; font-size: 0.9rem; color: #2d3748; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; font-size: 0.9rem; color: #2d3748; text-align: right;">₹${item.price}</td>
      <td style="padding: 10px; font-size: 0.9rem; color: #2d3748; text-align: right; font-weight: 600;">₹${item.price * item.quantity}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Request - International Mobile</title>
    </head>
    <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7fafc; padding: 20px; margin: 0; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e1e24 0%, #2a2a35 100%); padding: 30px; text-align: center; border-bottom: 4px solid #ff5722;">
          <h1 style="color: #ffffff; font-size: 1.6rem; font-weight: 800; margin: 0; letter-spacing: 1px;">
            INTERNATIONAL <span style="color: #ff5722;">MOBILE</span>
          </h1>
          <p style="color: #a0aec0; font-size: 0.85rem; margin: 5px 0 0 0; text-transform: uppercase; font-weight: 600;">Wholesale Mobile Accessories</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 1rem; color: #2d3748; margin: 0 0 10px 0;">Dear <strong>${order.customerName}</strong>,</p>
            <p style="font-size: 0.9rem; color: #4a5568; line-height: 1.5; margin: 0;">
              Thank you for ordering with us. Your order from <strong>${order.shopName}</strong> is currently in ${getStatusBadgeHtml(order.status)} status.
            </p>
          </div>

          <!-- Alert Box -->
          <div style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
            <h4 style="color: #dd6b20; font-size: 0.95rem; margin: 0 0 6px 0; font-weight: 700;">Outstanding Payment Details</h4>
            <p style="font-size: 0.88rem; color: #7b341e; margin: 0 0 10px 0; line-height: 1.4;">
              Please arrange the payment for your bulk order to process packaging and prompt shipment.
            </p>
            <div style="font-size: 1.1rem; color: #2d3748;">
              Amount to Pay: <strong style="color: #ff5722; font-size: 1.25rem;">₹${order.total}</strong>
            </div>
          </div>

          <!-- Order details meta -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 0.85rem; color: #4a5568; background-color: #f8fafc; border-radius: 6px; padding: 15px; border: 1px solid #edf2f7;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; width: 120px;">Order Number:</td>
              <td style="padding: 8px 12px; color: #1a202c; font-family: monospace; font-size: 0.9rem; font-weight: bold;">${order.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold;">Order Date:</td>
              <td style="padding: 8px 12px;">${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold;">Mobile:</td>
              <td style="padding: 8px 12px;">${order.mobile}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold;">Shop Name:</td>
              <td style="padding: 8px 12px;">${order.shopName}</td>
            </tr>
          </table>

          <!-- Items Table -->
          <h3 style="font-size: 1rem; font-weight: 700; color: #2d3748; margin: 0 0 10px 0; border-bottom: 2px solid #edf2f7; padding-bottom: 6px;">
            Items Ordered
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #f7fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px; font-size: 0.8rem; font-weight: 700; color: #718096; text-align: left;">Product</th>
                <th style="padding: 10px; font-size: 0.8rem; font-weight: 700; color: #718096; text-align: center; width: 50px;">Qty</th>
                <th style="padding: 10px; font-size: 0.8rem; font-weight: 700; color: #718096; text-align: right; width: 80px;">Price</th>
                <th style="padding: 10px; font-size: 0.8rem; font-weight: 700; color: #718096; text-align: right; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Total Calculations -->
          <div style="width: 100%; display: table; margin-bottom: 30px; font-size: 0.9rem; color: #4a5568;">
            <div style="display: table-row;">
              <div style="display: table-cell; text-align: right; padding: 4px 10px; font-weight: bold;">Subtotal:</div>
              <div style="display: table-cell; text-align: right; padding: 4px 10px; width: 100px;">₹${order.subtotal}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; text-align: right; padding: 4px 10px; font-weight: bold;">Delivery Charge:</div>
              <div style="display: table-cell; text-align: right; padding: 4px 10px;">₹${order.deliveryCharge}</div>
            </div>
            ${order.discount ? `
            <div style="display: table-row; color: #c53030;">
              <div style="display: table-cell; text-align: right; padding: 4px 10px; font-weight: bold;">Discount Applied:</div>
              <div style="display: table-cell; text-align: right; padding: 4px 10px;">-₹${order.discount}</div>
            </div>
            ` : ''}
            <div style="display: table-row; font-size: 1.1rem; color: #2d3748; font-weight: bold;">
              <div style="display: table-cell; text-align: right; padding: 8px 10px; border-top: 2px solid #e2e8f0;">Grand Total:</div>
              <div style="display: table-cell; text-align: right; padding: 8px 10px; color: #ff5722; border-top: 2px solid #e2e8f0;">₹${order.total}</div>
            </div>
          </div>

          <!-- Payment Guide -->
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 6px; border: 1px solid #edf2f7; text-align: center;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #2d3748; margin: 0 0 8px 0;">Need Assistance?</h4>
            <p style="font-size: 0.85rem; color: #4a5568; margin: 0 0 12px 0; line-height: 1.4;">
              If you have any questions regarding device compatibility, wholesale margins, or bulk discounts, please contact proprietor <strong>Hassan Siddiqui</strong> directly on WhatsApp.
            </p>
            <a href="https://wa.me/919135084931" style="display: inline-block; background-color: #25d366; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 0.88rem; box-shadow: 0 2px 4px rgba(37,211,102,0.2);">
              Chat on WhatsApp (+91 9135084931)
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #edf2f7; font-size: 0.75rem; color: #718096;">
          <p style="margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} International Mobile. All rights reserved.</p>
          <p style="margin: 0;">Certified Quality Mobile Accessories Wholesaler</p>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Send payment request email to target customer address
 */
const sendPaymentRequestEmail = async (order, customEmail) => {
  const targetEmail = (customEmail || order.email || '').trim();
  if (!targetEmail) {
    throw new Error("No recipient email address provided.");
  }

  const transporter = getTransporter();
  const subject = `Payment Details - Bulk Order #${order.orderNumber} - International Mobile`;
  const htmlContent = generatePaymentRequestTemplate(order);

  if (!transporter) {
    // SMTP config is missing: Fall back to console log print
    console.log(`
======================================================================
[SMTP DRY-RUN] Email successfully generated for customer order!
To: ${targetEmail}
Subject: ${subject}
----------------------------------------------------------------------
Invoice/Amount: ₹${order.total}
Order Number: ${order.orderNumber}
Customer: ${order.customerName} (${order.shopName})
Phone: ${order.mobile}
----------------------------------------------------------------------
Check HTML template inside services/mailService.js
======================================================================
    `);
    return {
      success: true,
      dryRun: true,
      message: 'SMTP credentials missing. Email printed to server console instead (Dry-Run Mode).'
    };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"International Mobile" <${process.env.SMTP_USER}>`,
    to: targetEmail,
    subject: subject,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    dryRun: false,
    messageId: info.messageId,
    message: 'Email dispatched successfully via SMTP.'
  };
};

module.exports = {
  sendPaymentRequestEmail
};
