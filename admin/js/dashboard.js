// TechZone Mobile Accessories - Admin Dashboard Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with admin guard completion
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      loadDashboardData();
    }
  }, 100);
});

// Load real data to cards
async function loadDashboardData() {
  try {
    // 1. Fetch products & orders
    const products = await window.api.products.getAll();
    const orders = await window.api.orders.getAll();

    // 2. Compute Card Metrics
    // Out of Stock Count
    const outOfStockCount = products.filter(p => p.stock <= 0).length;
    document.getElementById('stat-outofstock-val').textContent = outOfStockCount;

    // Total Orders Count
    document.getElementById('stat-orders-val').textContent = orders.length;

    // Pending Orders Count
    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
    document.getElementById('stat-pending-val').textContent = pendingOrdersCount;

    // Total Revenue (exclude Cancelled orders)
    const revenueVal = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-revenue-val').textContent = `₹${revenueVal.toLocaleString('en-IN')}`;

    // Today's metrics calculation
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfToday;
    });

    const todayOrdersCount = todayOrders.length;
    const todayRevenueVal = todayOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    document.getElementById('stat-today-orders-val').textContent = `Today's: ${todayOrdersCount}`;
    document.getElementById('stat-today-revenue-val').textContent = `Today's: ₹${todayRevenueVal.toLocaleString('en-IN')}`;

    // 3. Render Recent Orders (limit 5)
    renderRecentOrders(orders.slice(0, 5));

    // 4. Render Low Stock Warning List (stock < 10)
    renderLowStock(products);

    // 5. Render Bestsellers List
    renderBestsellersList(products);

  } catch (err) {
    console.error("Dashboard loading error", err);
  }
}

function renderRecentOrders(recentOrders) {
  const tbody = document.getElementById('dashboard-recent-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  
  if (recentOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders recorded yet.</td></tr>`;
    return;
  }

  recentOrders.forEach(order => {
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
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
      <td data-label="Customer">${order.customerName}</td>
      <td data-label="Status"><span class="admin-badge ${badgeClass}">${order.status}</span></td>
      <td data-label="Total" style="font-weight: 700;">₹${order.total}</td>
      <td data-label="Date">${dateStr}</td>
      <td data-label="Action">
        <a href="orders.html?id=${order.id}" class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;">Manage</a>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderLowStock(products) {
  const container = document.getElementById('dashboard-low-stock-list');
  if (!container) return;

  // Filter items that are low stock (less than 10 units, including out of stock)
  const lowStockItems = products.filter(p => p.stock < 10).sort((a,b) => a.stock - b.stock);

  container.innerHTML = '';
  
  if (lowStockItems.length === 0) {
    container.innerHTML = `<div style="padding: 10px; font-size: 0.85rem; color: var(--success); text-align: center; font-weight: 600;">All accessory stocks are healthy!</div>`;
    return;
  }

  lowStockItems.slice(0, 5).forEach(prod => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '8px 0';
    item.style.borderBottom = '1px solid var(--border-admin)';
    
    let badgeClass = 'admin-badge-warning';
    let badgeText = `${prod.stock} Left`;
    if (prod.stock <= 0) {
      badgeClass = 'admin-badge-danger';
      badgeText = 'Out of Stock';
    }

    item.innerHTML = `
      <div style="flex-grow: 1; min-width: 0; padding-right: 10px;">
        <span style="font-weight: 600; font-size: 0.85rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Brand: ${prod.brand} | SKU: ${prod.sku}</span>
      </div>
      <span class="admin-badge ${badgeClass}" style="flex-shrink: 0; font-weight: 800;">${badgeText}</span>
    `;
    container.appendChild(item);
  });
}

function renderBestsellersList(products) {
  const container = document.getElementById('dashboard-bestsellers-list');
  if (!container) return;

  const bestsellers = products.filter(p => p.bestseller && p.status === 'active');

  container.innerHTML = '';
  
  if (bestsellers.length === 0) {
    container.innerHTML = `<div style="padding: 10px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">No bestsellers flagged.</div>`;
    return;
  }

  bestsellers.slice(0, 5).forEach(prod => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '8px 0';
    item.style.borderBottom = '1px solid var(--border-admin)';
    
    item.innerHTML = `
      <div style="flex-grow: 1; min-width: 0; padding-right: 10px;">
        <span style="font-weight: 600; font-size: 0.85rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.name}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Rating: ${prod.rating || 4.5} ★ | ${prod.brand}</span>
      </div>
      <span style="font-weight: 700; font-size: 0.85rem; color: var(--primary-color);">₹${prod.discountPrice || prod.price}</span>
    `;
    container.appendChild(item);
  });
}
