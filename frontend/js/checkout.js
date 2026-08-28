// TechZone Mobile Accessories - Checkout Page Controller

let subtotalVal = 0;
let deliveryVal = 0;
let totalVal = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const items = window.cart.get();
  
  if (items.length === 0) {
    window.location.href = 'shop.html';
    return;
  }

  // Render items summary
  await renderCheckoutSummary(items);

  // Bind form submit
  const form = document.getElementById('checkout-submit-form');
  if (form) {
    form.addEventListener('submit', handlePlaceOrder);
  }
});

// Render the cart items panel
async function renderCheckoutSummary(items) {
  const container = document.getElementById('checkout-summary-items-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const deliveryEl = document.getElementById('checkout-delivery');
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
  const settings = await window.api.settings.get();
  
  if (subtotalEl) subtotalEl.textContent = `₹${subtotalVal}`;

  const threshold = settings.freeDeliveryThreshold;
  deliveryVal = subtotalVal >= threshold ? 0 : settings.deliveryCharge;

  if (deliveryEl) {
    deliveryEl.textContent = deliveryVal === 0 ? 'FREE' : `₹${deliveryVal}`;
  }

  totalVal = subtotalVal + deliveryVal;
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
    discount: 0,
    total: totalVal,
    paymentMethod: 'Cash on Delivery (COD)',
    address: 'N/A',
    city: 'N/A',
    state: 'N/A',
    pincode: 'N/A',
    orderNotes: ''
  };

  try {
    // Show spinner loader or disable submit
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Order...';
    }

    // Call Mock API
    const order = await window.api.orders.create(orderPayload);
    
    // Clear Shopping Cart cache
    window.cart.clear();

    // Store order ID to show on success page
    sessionStorage.setItem('tz_last_order_id', order.id);

    // Redirect to Order Success
    window.location.href = 'order-success.html';

  } catch (err) {
    console.error(err);
    window.showToast(err.message || "Failed to place order. Please try again.", "error");
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Cash on Delivery Order';
    }
  }
}
