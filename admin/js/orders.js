// TechZone Mobile Accessories - Admin Orders Controller

let activeStatusFilter = '';
let selectedOrder = null;
let currentOrdersList = [];
let cachedOrders = null;

// Helper to fetch orders and cache them locally
async function getOrdersData(forceRefetch = false) {
  if (!cachedOrders || forceRefetch) {
    cachedOrders = await window.api.orders.getAll();
  }
  return cachedOrders;
}

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.api.auth.me();
  if (session) {
    initializeOrdersPage();
  } else {
    window.location.href = 'login.html';
  }
});

async function initializeOrdersPage() {
  // 1. Render Orders Table (force initial fetch)
  await renderOrdersTable(true);

  // 2. Bind Filter events
  const statusFilter = document.getElementById('admin-orders-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      activeStatusFilter = e.target.value;
      renderOrdersTable(false); // filter from cached list
    });
  }

  // Bind Export button
  const exportBtn = document.getElementById('btn-export-orders');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportOrdersToCSV);
  }

  // 3. Bind Modal events
  const modalCloseBtn = document.getElementById('btn-close-order-modal');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeOrderModal);
  }

  const saveChangesBtn = document.getElementById('btn-save-order-changes');
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener('click', handleSaveOrderChanges);
  }

  const sendEmailBtn = document.getElementById('btn-send-payment-email');
  if (sendEmailBtn) {
    sendEmailBtn.addEventListener('click', handleSendPaymentEmail);
  }

  const deleteBtn = document.getElementById('btn-delete-order-action');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeleteOrder);
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

async function renderOrdersTable(forceRefetch = false) {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  try {
    let orders = await getOrdersData(forceRefetch);
    tbody.innerHTML = '';

    // Filter by status dropdown
    if (activeStatusFilter) {
      orders = orders.filter(o => o.status === activeStatusFilter);
    }

    currentOrdersList = orders; // Save to global variable for export

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
  document.getElementById('modal-cust-name').value = order.customerName || '';
  document.getElementById('modal-cust-shop').value = order.shopName || '';
  document.getElementById('modal-cust-mobile').value = order.mobile || '';
  document.getElementById('modal-cust-email').value = order.email || '';
  document.getElementById('modal-cust-address').textContent = `${order.address || 'N/A'}, ${order.city || 'N/A'}, ${order.state || 'N/A'} - ${order.pincode || 'N/A'}`;

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

async function handleSaveOrderChanges() {
  if (!selectedOrder) return;

  const select = document.getElementById('modal-status-select');
  const newStatus = select.value;

  const name = document.getElementById('modal-cust-name').value.trim();
  const shop = document.getElementById('modal-cust-shop').value.trim();
  const mobile = document.getElementById('modal-cust-mobile').value.trim();
  const email = document.getElementById('modal-cust-email') ? document.getElementById('modal-cust-email').value.trim() : '';

  if (!name || !shop || !mobile) {
    window.showToast("Name, Shop Name, and Mobile Number are required.", "error");
    return;
  }

  try {
    // 1. Update Status if it changed
    if (selectedOrder.status !== newStatus) {
      await window.api.orders.updateStatus(selectedOrder.id, newStatus);
    }

    // 2. Update Customer Details (Rename/Shop/Mobile/Email)
    await window.api.orders.updateDetails(selectedOrder.id, {
      customerName: name,
      shopName: shop,
      mobile: mobile,
      email: email
    });

    window.showToast("Order changes saved successfully.", "success");
    closeOrderModal();
    renderOrdersTable(true); // Refresh table grid and force refetch new data
  } catch (err) {
    console.error(err);
    window.showToast("Failed to save changes", "error");
  }
}

async function handleDeleteOrder() {
  if (!selectedOrder) return;

  const confirmDelete = confirm("Are you sure you want to permanently delete this order? This action cannot be undone.");
  if (!confirmDelete) return;

  try {
    await window.api.orders.delete(selectedOrder.id);
    window.showToast("Order deleted successfully", "success");
    closeOrderModal();
    renderOrdersTable(true); // Refresh table grid and force refetch new data
  } catch (err) {
    console.error(err);
    window.showToast("Failed to delete order", "error");
  }
}

function exportOrdersToCSV() {
  if (currentOrdersList.length === 0) {
    window.showToast("No orders available to export.", "warning");
    return;
  }

  const headers = [
    'Order ID', 'Customer Name', 'Shop Name', 'Mobile Number', 'Email', 
    'Products (Items)', 'Subtotal (INR)', 'Delivery Charge', 'Discount', 'Total Amount (INR)', 
    'Payment Method', 'Shipping Address', 'City', 'State', 'Pincode', 'Status', 'Date'
  ];

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += headers.join(",") + "\n";

  currentOrdersList.forEach(order => {
    const itemsStr = order.products.map(p => `${p.name} [Qty: ${p.quantity}]`).join("; ");
    const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const row = [
      order.id,
      order.customerName,
      order.shopName || '',
      order.mobile,
      order.email || '',
      itemsStr,
      order.subtotal.toString(),
      order.deliveryCharge.toString(),
      order.discount.toString(),
      order.total.toString(),
      order.paymentMethod || 'Cash on Delivery (COD)',
      order.address || '',
      order.city || '',
      order.state || '',
      order.pincode || '',
      order.status,
      dateStr
    ];

    const escapedRow = row.map(val => {
      const clean = val.replace(/"/g, '""');
      return clean.includes(',') || clean.includes(';') || clean.includes('\n') ? `"${clean}"` : clean;
    });
    csvContent += escapedRow.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `orders_database_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.showToast("Orders database exported successfully!", "success");
}

async function handleSendPaymentEmail() {
  if (!selectedOrder) return;

  const emailInput = document.getElementById('modal-cust-email');
  const emailVal = emailInput ? emailInput.value.trim() : '';

  if (!emailVal) {
    window.showToast("Please provide a valid customer email address to send the payment details.", "error");
    return;
  }

  const sendEmailBtn = document.getElementById('btn-send-payment-email');
  const originalHtml = sendEmailBtn.innerHTML;

  sendEmailBtn.disabled = true;
  sendEmailBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

  try {
    const res = await window.api.orders.sendPaymentEmail(selectedOrder.id, emailVal);
    if (res.dryRun) {
      window.showToast("Dry-Run: Email logged to server console (SMTP unconfigured).", "info");
    } else {
      window.showToast("Payment request email successfully sent to customer!", "success");
    }
  } catch (err) {
    console.error(err);
    window.showToast(err.message || "Failed to send email notification", "error");
  } finally {
    sendEmailBtn.disabled = false;
    sendEmailBtn.innerHTML = originalHtml;
  }
}
