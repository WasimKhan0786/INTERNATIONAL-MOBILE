// TechZone Mobile Accessories - Order Success Page Controller

document.addEventListener('DOMContentLoaded', async () => {
  const lastOrderId = sessionStorage.getItem('tz_last_order_id');

  if (!lastOrderId) {
    window.location.href = 'index.html';
    return;
  }

  // Load details
  await loadOrderReceipt(lastOrderId);
});

// Load order details
async function loadOrderReceipt(orderId) {
  try {
    const order = await window.api.orders.getById(orderId);
    const settings = await window.api.settings.get();

    // Fill elements
    document.getElementById('success-order-id-label').textContent = order.id;
    document.getElementById('detail-name').textContent = order.customerName;
    document.getElementById('detail-mobile').textContent = order.mobile;
    document.getElementById('detail-address').textContent = `${order.address}, ${order.city}, ${order.state} - ${order.pincode}`;
    document.getElementById('detail-subtotal').textContent = `₹${order.subtotal}`;
    
    document.getElementById('detail-delivery').textContent = order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`;
    document.getElementById('detail-total').textContent = `₹${order.total}`;

    // Build WhatsApp Confirmation Message
    const itemsText = order.products.map((p, idx) => `${idx + 1}. *${p.name}* (Brand: ${p.brand || 'N/A'}) \n   Qty: ${p.quantity} | Price: ₹${p.price * p.quantity}`).join('\n\n');
    
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const textMsg = `🛍️ *NEW ORDER CONFIRMATION* 🛍️
-----------------------------------
Hello *${settings.shopName}*,

I have just placed an order on your website. Please find my order details below:

🆔 *Order ID:* ${order.id}
📅 *Date:* ${dateStr}

👤 *CUSTOMER DETAILS:*
• *Name:* ${order.customerName}
• *Mobile:* ${order.mobile}
• *Email:* ${order.email || 'N/A'}

📦 *DELIVERY ADDRESS:*
${order.address},
${order.city}, ${order.state} - ${order.pincode}

🗒️ *Order Notes:* ${order.orderNotes || 'None'}

🛒 *ORDERED ITEMS:*
${itemsText}

💵 *BILLING DETAILS:*
• *Subtotal:* ₹${order.subtotal}
• *Delivery Charge:* ${order.deliveryCharge === 0 ? 'FREE' : '₹' + order.deliveryCharge}
• *Total Amount:* *₹${order.total}*
• *Payment Method:* Cash on Delivery (COD)
-----------------------------------
Please confirm my order and let me know the estimated delivery time. Thank you! 🙏`;

    let cleanNum = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
    if (cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    if (!cleanNum) {
      cleanNum = '917654085663'; // Fallback
    }
    const whatsappUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;
    const whatsappBtn = document.getElementById('btn-success-whatsapp-confirm');
    if (whatsappBtn) {
      whatsappBtn.href = whatsappUrl;
    }

    // Auto redirect to WhatsApp in a new tab
    setTimeout(() => {
      try {
        const waWindow = window.open(whatsappUrl, '_blank');
        if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
          console.log("Popup blocker prevented automatic redirection. User can click button manually.");
        }
      } catch (e) {
        console.error("Auto redirect failed", e);
      }
    }, 1200);

  } catch (err) {
    console.error("Failed to load order receipt info", err);
    window.showToast("Failed to load order receipt details.", "error");
  }
}
