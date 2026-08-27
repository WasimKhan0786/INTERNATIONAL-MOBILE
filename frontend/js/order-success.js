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
    const itemsText = order.products.map(p => `- ${p.name} x${p.quantity} (₹${p.price * p.quantity})`).join('\n');
    
    const textMsg = `Hi *${settings.shopName}*,

I just placed an order on your website. Here are my details:
*Order Number:* ${order.id}
*Name:* ${order.customerName}
*Mobile:* ${order.mobile}

*Items Ordered:*
${itemsText}

*Subtotal:* ₹${order.subtotal}
*Delivery Charge:* ${order.deliveryCharge === 0 ? 'FREE' : '₹' + order.deliveryCharge}
*Total Amount:* ₹${order.total}

*Delivery Address:*
${order.address}, ${order.city}, ${order.state} - ${order.pincode}

Please confirm my order. Thank you!`;

    const cleanNum = settings.whatsapp.replace(/[^0-9]/g, '');
    const whatsappBtn = document.getElementById('btn-success-whatsapp-confirm');
    if (whatsappBtn) {
      whatsappBtn.href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;
    }

  } catch (err) {
    console.error("Failed to load order receipt info", err);
    window.showToast("Failed to load order receipt details.", "error");
  }
}
