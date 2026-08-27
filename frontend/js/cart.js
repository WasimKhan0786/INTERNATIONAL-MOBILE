// TechZone Mobile Accessories - Cart Page Controller

document.addEventListener('DOMContentLoaded', () => {
  renderCart();

  // Listen to cart update event dispatched by common.js
  window.addEventListener('cartUpdated', () => {
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
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
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
          <input type="number" class="qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn btn-cart-plus" data-id="${item.id}" data-qty="${item.quantity}"><i class="fa-solid fa-plus"></i></button>
        </div>
        <!-- Item Total -->
        <div style="font-weight: 700; min-width: 70px; text-align: right;">₹${item.price * item.quantity}</div>
        <!-- Trash button -->
        <button class="cart-item-delete btn-cart-delete" data-id="${item.id}" title="Remove Item"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    `;

    // Bind qty changes
    row.querySelector('.btn-cart-minus').addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const q = parseInt(e.currentTarget.dataset.qty);
      window.cart.update(id, q - 1);
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
          window.cart.update(id, q + 1);
        }
      } catch (err) {
        console.error(err);
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
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');
  const shippingMsg = document.getElementById('free-shipping-msg');
  const shippingBox = document.getElementById('free-shipping-bar-box');

  const subtotal = window.cart.getSubtotal();
  const settings = await window.api.settings.get();
  
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  
  let deliveryFee = settings.deliveryCharge;
  const threshold = settings.freeDeliveryThreshold;

  if (subtotal >= threshold) {
    deliveryFee = 0;
    if (deliveryEl) deliveryEl.textContent = 'FREE';
    if (shippingMsg) shippingMsg.textContent = 'Congratulations! Your order qualifies for FREE Delivery.';
    if (shippingBox) {
      shippingBox.style.borderLeftColor = 'var(--success)';
      shippingBox.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
    }
  } else {
    if (deliveryEl) deliveryEl.textContent = `₹${deliveryFee}`;
    const diff = threshold - subtotal;
    if (shippingMsg) shippingMsg.textContent = `Add ₹${diff} more for FREE Delivery!`;
    if (shippingBox) {
      shippingBox.style.borderLeftColor = 'var(--primary-color)';
      shippingBox.style.backgroundColor = 'rgba(255, 87, 34, 0.05)';
    }
  }

  const grandTotal = subtotal + deliveryFee;
  if (totalEl) totalEl.textContent = `₹${grandTotal}`;
}
