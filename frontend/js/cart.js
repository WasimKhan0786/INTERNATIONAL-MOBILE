// TechZone Mobile Accessories - Cart Page Controller

window.isUpdatingCartLocally = false;
let cartDiscountVal = 0;
let cartAppliedCouponCode = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check if user won spin coupon
  const savedSpin = localStorage.getItem('techzone_spin_result');
  if (savedSpin) {
    try {
      const parsed = JSON.parse(savedSpin);
      if (parsed.winningSlice && parsed.winningSlice.isWin && parsed.winningSlice.code) {
        cartAppliedCouponCode = parsed.winningSlice.code;
      }
    } catch (e) {}
  }

  const couponInput = document.getElementById('cart-coupon-input');
  const applyBtn = document.getElementById('btn-apply-cart-coupon');

  if (cartAppliedCouponCode && couponInput) {
    couponInput.value = cartAppliedCouponCode;
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const code = couponInput ? couponInput.value.trim().toUpperCase() : '';
      if (!code) {
        window.showToast("Please enter a valid coupon code.", "error");
        return;
      }
      applyCartCouponCode(code);
    });
  }

  renderCart();

  // Listen to cart update event dispatched by common.js
  window.addEventListener('cartUpdated', () => {
    if (window.isUpdatingCartLocally) return;
    renderCart();
  });

  const clearBtn = document.getElementById('btn-clear-cart-action');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      window.showConfirmModal(
        "Clear Cart", 
        "Are you sure you want to remove all items from your shopping cart?", 
        () => {
          window.cart.clear();
          window.showToast("Shopping cart cleared.", "info");
        }
      );
    });
  }
});

function applyCartCouponCode(code) {
  const msgEl = document.getElementById('cart-coupon-msg');
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
    cartDiscountVal = 0;
    cartAppliedCouponCode = '';
    renderSummary();
    return;
  }

  cartAppliedCouponCode = code;
  if (msgEl) {
    msgEl.style.display = 'block';
    msgEl.style.color = '#10b981';
    msgEl.textContent = `🎉 Coupon '${code}' active! (${coupon.label})`;
  }
  renderSummary();
}

// Render the cart elements
async function renderCart() {
  const emptyState = document.getElementById('cart-empty-state');
  const activeLayout = document.getElementById('cart-active-layout');
  const itemsContainer = document.getElementById('cart-items-list');

  if (!itemsContainer) return;

  const items = window.cart.get();
  
  if (items.length === 0) {
    if (activeLayout) activeLayout.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (activeLayout) activeLayout.style.display = 'grid';

  itemsContainer.innerHTML = '';
  
  // Render Item rows
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    
    row.innerHTML = `
      <div class="cart-item-img">
        <img src="${window.getOptimizedImageUrl(item.image, { width: 200 })}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
      </div>
      <div class="cart-item-details">
        <div class="cart-item-brand">${item.brand}</div>
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="cart-item-actions">
        <!-- Qty controls -->
        <div class="qty-control">
          <button class="qty-btn btn-cart-minus" data-id="${item.id}" data-qty="${item.quantity}"><i class="fa-solid fa-minus"></i></button>
          <input type="number" class="qty-input cart-qty-input" data-id="${item.id}" value="${item.quantity}" min="1">
          <button class="qty-btn btn-cart-plus" data-id="${item.id}" data-qty="${item.quantity}"><i class="fa-solid fa-plus"></i></button>
        </div>
        <!-- Item Total -->
        <div class="cart-item-total-val" style="font-weight: 700; min-width: 70px; text-align: right;">₹${item.price * item.quantity}</div>
        <!-- Trash button -->
        <button class="cart-item-delete btn-cart-delete" data-id="${item.id}" title="Remove Item"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;

    // Helper to update specific row values dynamically without destroying DOM focus
    const updateRowValues = (newQty) => {
      const btnMinus = row.querySelector('.btn-cart-minus');
      const btnPlus = row.querySelector('.btn-cart-plus');
      const inputEl = row.querySelector('.cart-qty-input');
      const totalValEl = row.querySelector('.cart-item-total-val');

      if (btnMinus) btnMinus.dataset.qty = newQty;
      if (btnPlus) btnPlus.dataset.qty = newQty;
      if (inputEl && parseInt(inputEl.value) !== newQty) inputEl.value = newQty;
      if (totalValEl) totalValEl.textContent = `₹${item.price * newQty}`;

      renderSummary();
    };

    // Bind qty changes
    row.querySelector('.btn-cart-minus').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const q = parseInt(e.currentTarget.dataset.qty);
      if (q - 1 < 1) return;
      window.isUpdatingCartLocally = true;
      window.cart.update(id, q - 1);
      window.isUpdatingCartLocally = false;
      updateRowValues(q - 1);
    });

    row.querySelector('.btn-cart-plus').addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const q = parseInt(e.currentTarget.dataset.qty);
      
      // Verify available stock
      try {
        const prod = await window.api.products.getById(id);
        if (q + 1 > prod.stock) {
          window.showToast(`Only ${prod.stock} units of this accessory are available in stock.`, "error");
        } else {
          window.isUpdatingCartLocally = true;
          window.cart.update(id, q + 1);
          window.isUpdatingCartLocally = false;
          updateRowValues(q + 1);
        }
      } catch (err) {
        console.error(err);
      }
    });

    // Bind manual inputs for cart items
    const manualInput = row.querySelector('.cart-qty-input');
    
    manualInput.addEventListener('input', async (e) => {
      const val = parseInt(e.target.value);
      if (isNaN(val)) return; // Allow typing
      if (val < 1) {
        e.target.value = 1;
        window.isUpdatingCartLocally = true;
        window.cart.update(item.id, 1);
        window.isUpdatingCartLocally = false;
        updateRowValues(1);
        return;
      }
      try {
        const prod = await window.api.products.getById(item.id);
        if (val > prod.stock) {
          window.showToast(`Only ${prod.stock} units of this accessory are available in stock.`, "error");
          e.target.value = prod.stock;
          window.isUpdatingCartLocally = true;
          window.cart.update(item.id, prod.stock);
          window.isUpdatingCartLocally = false;
          updateRowValues(prod.stock);
        } else {
          window.isUpdatingCartLocally = true;
          window.cart.update(item.id, val);
          window.isUpdatingCartLocally = false;
          updateRowValues(val);
        }
      } catch (err) {
        console.error(err);
      }
    });

    manualInput.addEventListener('change', async (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 1) val = 1;
      try {
        const prod = await window.api.products.getById(item.id);
        if (val > prod.stock) {
          window.showToast(`Only ${prod.stock} units of this accessory are available in stock.`, "error");
          val = prod.stock;
        }
        e.target.value = val;
        window.isUpdatingCartLocally = true;
        window.cart.update(item.id, val);
        window.isUpdatingCartLocally = false;
        updateRowValues(val);
      } catch (err) {
        console.error(err);
        e.target.value = item.quantity;
      }
    });

    // Bind delete
    row.querySelector('.btn-cart-delete').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      window.cart.remove(id);
    });

    itemsContainer.appendChild(row);
  }

  // Draw Summary calculations
  await renderSummary();
}

// Subtotal & Shipping summary card
async function renderSummary() {
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  const discountRow = document.getElementById('cart-discount-row');
  const discountEl = document.getElementById('summary-discount');
  const couponSpan = document.getElementById('cart-applied-coupon-span');

  const subtotal = window.cart.getSubtotal();

  if (cartAppliedCouponCode) {
    const knownCoupons = {
      'FESTIVE10': { type: 'percentage', value: 10 },
      'MEGA15': { type: 'percentage', value: 15 },
      'SUPER20': { type: 'percentage', value: 20 },
      'LUCKY5': { type: 'percentage', value: 5 },
      'FREESHIP': { type: 'flat', value: 50 },
      'FREEGIFT': { type: 'flat', value: 50 },
      'WELCOME10': { type: 'percentage', value: 10 }
    };
    const c = knownCoupons[cartAppliedCouponCode];
    if (c) {
      if (c.type === 'percentage') {
        cartDiscountVal = Math.round((subtotal * c.value) / 100);
      } else {
        cartDiscountVal = Math.min(c.value, subtotal);
      }
    }
  } else {
    cartDiscountVal = 0;
  }

  const finalTotal = Math.max(0, subtotal - cartDiscountVal);

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (discountRow) {
    if (cartDiscountVal > 0) {
      discountRow.style.display = 'flex';
      if (couponSpan) couponSpan.textContent = cartAppliedCouponCode;
      if (discountEl) discountEl.textContent = `-₹${cartDiscountVal}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
  if (totalEl) totalEl.textContent = `₹${finalTotal}`;
}
