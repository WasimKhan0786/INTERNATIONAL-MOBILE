// TechZone Mobile Accessories - Admin Orders Controller

let activeStatusFilter = '';
let selectedOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with auth checks
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      initializeOrdersPage();
    }
  }, 100);
});

async function initializeOrdersPage() {
  // 1. Render Orders Table
  await renderOrdersTable();

  // 2. Bind Filter events
  const statusFilter = document.getElementById('admin-orders-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      activeStatusFilter = e.target.value;
      renderOrdersTable();
    });
  }

  // 3. Bind Modal events
  const modalCloseBtn = document.getElementById('btn-close-order-modal');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeOrderModal);
  }

  const updateStatusBtn = document.getElementById('btn-update-order-status');
  if (updateStatusBtn) {
    updateStatusBtn.addEventListener('click', handleUpdateOrderStatus);
  }

  // 4. Check if direct URL query exists (e.g. ?id=ORD-xxxx or ?status=Pending)
  const params = new URLSearchParams(window.location.search);
  const directId = params.get('id');
  const directStatus = params.get('status');
  if (directId) {
    openOrderById(directId);
  }
  if (directStatus) {
    activeStatusFilter = directStatus;
    const statusFilter = document.getElementById('admin-orders-filter-status');
    if (statusFilter) statusFilter.value = directStatus;
  }
}

async function renderOrdersTable() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  try {
    let orders = await window.api.orders.getAll();
    tbody.innerHTML = '';

    // Filter by status dropdown
    if (activeStatusFilter) {
      orders = orders.filter(o => o.status === activeStatusFilter);
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No orders found matching the filter status.</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      let badgeClass = 'admin-badge-warning';
      if (order.status === 'Delivered') badgeClass = 'admin-badge-success';
      if (order.status === 'Cancelled') badgeClass = 'admin-badge-danger';
      if (order.status === 'Confirmed' || order.status === 'Processing' || order.status === 'Shipped') {
        badgeClass = 'admin-badge-info';
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Order ID" style="font-weight: 700;">${order.id}</td>
        <td data-label="Customer Name">
          <strong>${order.customerName}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight: 500;">${order.shopName || 'N/A'}</span>
        </td>
        <td data-label="Mobile">${order.mobile}</td>
        <td data-label="Date">${dateStr}</td>
        <td data-label="Total Amount" style="font-weight: 800; color:var(--text-dark);">₹${order.total}</td>
        <td data-label="Status"><span class="admin-badge ${badgeClass}">${order.status}</span></td>
        <td data-label="Actions">
          <button class="btn btn-outline btn-sm btn-open-order" data-id="${order.id}" style="padding: 6px 12px; font-size: 0.75rem;">Open details</button>
        </td>
      `;

      row.querySelector('.btn-open-order').onclick = () => {
        openOrderModal(order);
      };

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Orders list load error", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load orders.</td></tr>`;
  }
}

// Open modal via specific ID
async function openOrderById(id) {
  try {
    const order = await window.api.orders.getById(id);
    if (order) {
      openOrderModal(order);
    }
  } catch (err) {
    console.error(err);
    window.showToast("Order ID not found", "error");
  }
}

function openOrderModal(order) {
  selectedOrder = order;

  // Set modal header title
  document.getElementById('modal-order-title').textContent = `Order Details: ${order.id}`;

  // Fill text info
  document.getElementById('modal-cust-name').innerHTML = `${order.customerName} <br><span style="font-size:0.8rem; font-weight:normal; color:var(--text-muted);">Shop: ${order.shopName || 'N/A'}</span>`;
  document.getElementById('modal-cust-mobile').textContent = order.mobile;
  document.getElementById('modal-cust-email').textContent = order.email;
  document.getElementById('modal-cust-address').textContent = `${order.address}, ${order.city}, ${order.state} - ${order.pincode}`;

  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('modal-order-date').textContent = dateStr;

  // Notes
  const notesBox = document.getElementById('modal-notes-box');
  if (order.orderNotes) {
    notesBox.style.display = 'block';
    document.getElementById('modal-cust-notes').textContent = `"${order.orderNotes}"`;
  } else {
    notesBox.style.display = 'none';
  }

  // Render items list
  const itemsContainer = document.getElementById('modal-order-items-container');
  if (itemsContainer) {
    itemsContainer.innerHTML = order.products.map(item => `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-admin); padding:10px 0; font-size:0.85rem;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${item.image}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid var(--border-admin);" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
          <div>
            <strong style="display:block; font-weight:600;">${item.name}</strong>
            <span style="color:var(--text-muted); font-size:0.75rem;">SKU: ${item.sku || 'N/A'}</span>
          </div>
        </div>
        <div style="font-weight:700;">₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}</div>
      </div>
    `).join('');
  }

  // Render totals
  document.getElementById('modal-subtotal').textContent = `₹${order.subtotal}`;
  document.getElementById('modal-delivery').textContent = order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`;
  document.getElementById('modal-total').textContent = `₹${order.total}`;

  // Pre-select status dropdown
  document.getElementById('modal-status-select').value = order.status;

  // Show Modal overlay
  document.getElementById('admin-order-modal').classList.add('show');
}

function closeOrderModal() {
  document.getElementById('admin-order-modal').classList.remove('show');
  selectedOrder = null;
}

async function handleUpdateOrderStatus() {
  if (!selectedOrder) return;

  const select = document.getElementById('modal-status-select');
  const newStatus = select.value;

  try {
    await window.api.orders.updateStatus(selectedOrder.id, newStatus);
    window.showToast(`Order status updated to ${newStatus}`, "success");
    closeOrderModal();
    renderOrdersTable(); // Refresh table grid
  } catch (err) {
    console.error(err);
    window.showToast("Failed to update status", "error");
  }
}
