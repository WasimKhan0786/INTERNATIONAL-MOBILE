// TechZone Mobile Accessories - Checkout Page Controller

let subtotalVal = 0;
let deliveryVal = 0;
let discountVal = 0;
let totalVal = 0;
let appliedCouponCode = '';

document.addEventListener('DOMContentLoaded', async () => {
  const items = window.cart.get();
  
  if (items.length === 0) {
    window.location.href = 'shop.html';
    return;
  }

  // Render items summary
  await renderCheckoutSummary(items);

  // Check if coupon is enabled and not used yet
  let settings = null;
  let isCouponOptionActive = false;
  try {
    settings = await window.api.settings.get();
    const campaignTime = settings.updatedAt;
    const usedCampaignTime = localStorage.getItem('techzone_coupon_used_campaign_time');
    const hasUsedForThisCampaign = (usedCampaignTime === campaignTime);
    isCouponOptionActive = settings.spinWheelActive && !hasUsedForThisCampaign;
    
    if (hasUsedForThisCampaign) {
      localStorage.removeItem('techzone_spin_result');
    }
  } catch (e) {
    console.error("Failed to load settings in checkout:", e);
  }

  const couponSection = document.getElementById('checkout-coupon-section');
  if (couponSection) {
    couponSection.style.display = isCouponOptionActive ? 'block' : 'none';
  }

  if (isCouponOptionActive) {
    // Check if customer won a coupon from Spin the Wheel
    const savedSpin = localStorage.getItem('techzone_spin_result');
    if (savedSpin) {
      try {
        const parsed = JSON.parse(savedSpin);
        if (parsed.winningSlice && parsed.winningSlice.isWin && parsed.winningSlice.code) {
          appliedCouponCode = parsed.winningSlice.code;
        }
      } catch (e) {}
    }
  } else {
    appliedCouponCode = '';
  }

  const couponInput = document.getElementById('checkout-coupon-input');
  const applyBtn = document.getElementById('btn-apply-coupon');

  if (appliedCouponCode && couponInput) {
    couponInput.value = appliedCouponCode;
    applyCouponCode(appliedCouponCode);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const code = couponInput ? couponInput.value.trim().toUpperCase() : '';
      if (!code) {
        window.showToast("Please enter a valid coupon code.", "error");
        return;
      }
      applyCouponCode(code);
    });
  }

  // Bind form submit
  const form = document.getElementById('checkout-submit-form');
  if (form) {
    form.addEventListener('submit', handlePlaceOrder);
  }
});

// Calculate and apply coupon code discount
function applyCouponCode(code) {
  const msgEl = document.getElementById('checkout-coupon-msg');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountEl = document.getElementById('checkout-discount');
  const couponSpan = document.getElementById('applied-coupon-code-span');
  const totalEl = document.getElementById('checkout-total');

  const knownCoupons = {
    'FESTIVE10': { type: 'percentage', value: 10, label: '10% OFF' },
    'MEGA15': { type: 'percentage', value: 15, label: '15% OFF' },
    'SUPER20': { type: 'percentage', value: 20, label: '20% OFF' },
    'LUCKY5': { type: 'percentage', value: 5, label: '5% OFF' },
    'FREESHIP': { type: 'flat', value: 50, label: 'Free Shipping / ₹50 OFF' },
    'FREEGIFT': { type: 'flat', value: 50, label: 'Free Gift / ₹50 OFF' },
    'WELCOME10': { type: 'percentage', value: 10, label: '10% OFF' }
  };

  const coupon = knownCoupons[code];

  if (!coupon) {
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.style.color = '#ef4444';
      msgEl.textContent = '❌ Invalid or expired coupon code.';
    }
    if (discountRow) discountRow.style.display = 'none';
    discountVal = 0;
    appliedCouponCode = '';
    totalVal = subtotalVal;
    if (totalEl) totalEl.textContent = `₹${totalVal}`;
    return;
  }

  if (coupon.type === 'percentage') {
    discountVal = Math.round((subtotalVal * coupon.value) / 100);
  } else {
    discountVal = Math.min(coupon.value, subtotalVal);
  }

  appliedCouponCode = code;
  totalVal = Math.max(0, subtotalVal - discountVal);

  if (couponSpan) couponSpan.textContent = code;
  if (discountEl) discountEl.textContent = `-₹${discountVal}`;
  if (discountRow) discountRow.style.display = 'flex';
  if (totalEl) totalEl.textContent = `₹${totalVal}`;

  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#10b981';
    msgEl.textContent = `🎉 Coupon '${code}' applied! Saved ₹${discountVal} (${coupon.label})`;
  }
}

// Render the cart items panel
async function renderCheckoutSummary(items) {
  const container = document.getElementById('checkout-summary-items-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const totalEl = document.getElementById('checkout-total');

  if (!container) return;

  container.innerHTML = '';
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.fontSize = '0.9rem';
    div.style.marginBottom = '10px';
    div.innerHTML = `
      <span style="flex-grow: 1; padding-right: 20px;">
        <strong>${item.name}</strong> 
        <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">Brand: ${item.brand} | Qty: ${item.quantity}</span>
      </span>
      <span style="font-weight: 600;">₹${item.price * item.quantity}</span>
    `;
    container.appendChild(div);
  });

  // Calculate prices
  subtotalVal = window.cart.getSubtotal();
  deliveryVal = 0;
  totalVal = Math.max(0, subtotalVal - discountVal);
  
  if (subtotalEl) subtotalEl.textContent = `₹${subtotalVal}`;
  if (totalEl) totalEl.textContent = `₹${totalVal}`;
}

// Process order submission
async function handlePlaceOrder(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const shopName = document.getElementById('cust-shop-name').value.trim();
  const mobile = document.getElementById('cust-mobile').value.trim();

  const cartItems = window.cart.get();

  const orderPayload = {
    customerName: name,
    shopName: shopName,
    mobile: mobile,
    email: '',
    products: cartItems,
    subtotal: subtotalVal,
    deliveryCharge: deliveryVal,
    discount: discountVal,
    couponCode: appliedCouponCode,
    total: totalVal,
    paymentMethod: 'Cash on Delivery (COD)',
    address: 'N/A',
    city: 'N/A',
    state: 'N/A',
    pincode: 'N/A',
    orderNotes: ''
  };

  let newTab = null;
  try {
    // Open a blank tab synchronously on click gesture to bypass popup blocker
    newTab = window.open('about:blank', '_blank');
  } catch (err) {
    console.error("Failed to pre-open tab:", err);
  }

  try {
    // Show spinner loader or disable submit
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...';
    }

    // Call Mock API
    const order = await window.api.orders.create(orderPayload);
    const settings = await window.api.settings.get();
    
    // Build WhatsApp Confirmation Message
    const itemsText = order.products.map((p, idx) => `${idx + 1}. *${p.name}* (Brand: ${p.brand || 'N/A'}) \n   Qty: ${p.quantity} | Price: ₹${p.price * p.quantity}`).join('\n\n');
    
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const discountText = discountVal > 0 ? `\n• *Coupon Discount (${appliedCouponCode}):* -₹${discountVal}` : '';

    const textMsg = `🛍️ *NEW ORDER CONFIRMATION* 🛍️
-----------------------------------
Hello *${settings.shopName}*,

I have just placed an order on your website. Please find my order details below:

🆔 *Order ID:* ${order.id}
📅 *Date:* ${dateStr}

👤 *CUSTOMER DETAILS:*
• *Name:* ${order.customerName}
• *Shop Name:* ${order.shopName || 'N/A'}
• *Mobile:* ${order.mobile}

🛒 *ORDERED ITEMS:*
${itemsText}

💵 *BILLING DETAILS:*
• *Subtotal:* ₹${order.subtotal}${discountText}
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

    if (newTab) {
      newTab.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank');
    }

    // Save that coupon has been used for this campaign
    if (settings && settings.updatedAt) {
      localStorage.setItem('techzone_coupon_used_campaign_time', settings.updatedAt);
    }
    localStorage.removeItem('techzone_spin_result');

    // Clear Shopping Cart cache
    window.cart.clear();

    // Store order ID to show on success page
    sessionStorage.setItem('tz_last_order_id', order.id);

    // Redirect to Order Success
    window.location.href = 'order-success.html';

  } catch (err) {
    console.error(err);
    if (newTab) {
      try { newTab.close(); } catch (e) {}
    }
    window.showToast(err.message || "Failed to place order. Please try again.", "error");
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-brands fa-whatsapp" style="font-size: 1.4rem;"></i> Confirm & Order on WhatsApp';
    }
  }
}
