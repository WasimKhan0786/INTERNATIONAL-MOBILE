// TechZone Mobile Accessories - Admin Products List Controller

let categoriesList = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with auth checks
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      initializeProductsPage();
    }
  }, 100);
});

async function initializeProductsPage() {
  // 1. Load Categories filter dropdown
  await loadCategoryDropdown();

  // 2. Fetch and render products
  await renderProductsTable();

  // 3. Bind search & filter inputs
  const searchInput = document.getElementById('admin-product-search');
  const catFilter = document.getElementById('admin-product-filter-category');

  if (searchInput) {
    searchInput.addEventListener('input', renderProductsTable);
  }
  if (catFilter) {
    catFilter.addEventListener('change', renderProductsTable);
  }
}

async function loadCategoryDropdown() {
  const dropdown = document.getElementById('admin-product-filter-category');
  if (!dropdown) return;

  try {
    categoriesList = await window.api.categories.getAll();
    dropdown.innerHTML = '<option value="">All Categories</option>' + 
      categoriesList.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
  } catch (err) {
    console.error("Dropdown categories error", err);
  }
}

async function renderProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('admin-product-search').value.trim();
  const catVal = document.getElementById('admin-product-filter-category').value;

  try {
    let products = await window.api.products.getAll({
      search: searchVal,
      category: catVal
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('stock') === 'out') {
      products = products.filter(p => p.stock <= 0);
    }

    tbody.innerHTML = '';

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No accessories found matching the criteria.</td></tr>`;
      return;
    }

    products.forEach(prod => {
      // Highlights HTML flags
      let highlights = [];
      if (prod.featured) highlights.push('<span class="admin-badge admin-badge-info" style="font-size:0.65rem; margin-bottom: 2px;">Featured</span>');
      if (prod.bestseller) highlights.push('<span class="admin-badge admin-badge-warning" style="font-size:0.65rem; margin-bottom: 2px;">Bestseller</span>');
      if (prod.newArrival) highlights.push('<span class="admin-badge admin-badge-success" style="font-size:0.65rem; margin-bottom: 2px;">New</span>');
      
      const highlightsHtml = highlights.length > 0 ? highlights.join('<br>') : '<span style="color:var(--text-muted); font-size:0.8rem;">None</span>';

      // Price Formatting
      const priceText = prod.discountPrice 
        ? `<strong>₹${prod.discountPrice}</strong><br><span style="text-decoration:line-through; font-size:0.8rem; color:var(--text-muted);">₹${prod.price}</span>`
        : `<strong>₹${prod.price}</strong>`;

      // Stock indicator
      let stockClass = 'admin-badge-success';
      if (prod.stock <= 0) stockClass = 'admin-badge-danger';
      else if (prod.stock < 10) stockClass = 'admin-badge-warning';

      // Switch check state
      const isChecked = prod.status === 'active' ? 'checked' : '';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Image">
          <img src="${prod.images[0] ? (prod.images[0].url || prod.images[0]) : ''}" alt="${prod.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px; border:1px solid var(--border-admin);" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
        </td>
        <td data-label="Product Info">
          <strong style="font-size:0.95rem; color:var(--text-dark);">${prod.name}</strong><br>
          <span style="font-size: 0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${prod.brand}</span>
        </td>
        <td data-label="Category">${formatSlugName(prod.categorySlug)}</td>
        <td data-label="SKU" style="font-family:monospace;">${prod.sku}</td>
        <td data-label="Price">${priceText}</td>
        <td data-label="Stock">
          <span class="admin-badge ${stockClass}">${prod.stock} Units</span>
        </td>
        <td data-label="Highlights">${highlightsHtml}</td>
        <td data-label="Status">
          <label class="admin-switch">
            <input type="checkbox" class="status-toggle-checkbox" data-id="${prod.id}" ${isChecked}>
            <span class="admin-slider"></span>
          </label>
        </td>
        <td data-label="Actions">
          <div style="display: flex; gap: 8px;">
            <a href="edit-product.html?id=${prod.id}" class="btn btn-outline btn-sm" style="padding:6px 10px; font-size:0.75rem;" title="Edit Product"><i class="fa-solid fa-pen"></i></a>
            <button class="btn btn-outline btn-sm btn-delete-product" data-id="${prod.id}" style="padding:6px 10px; font-size:0.75rem;" title="Delete Product"><i class="fa-solid fa-trash-can" style="color:var(--danger);"></i></button>
          </div>
        </td>
      `;

      // Status toggle switch handler
      row.querySelector('.status-toggle-checkbox').addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.checked ? 'active' : 'inactive';
        
        try {
          await window.api.products.save({
            id: id,
            status: newStatus
          });
          window.showToast(`Product status changed to ${newStatus}`, "success");
        } catch (err) {
          console.error(err);
          window.showToast("Failed to change status", "error");
          e.target.checked = !e.target.checked; // reverse toggling state
        }
      });

      // Delete Product handler
      row.querySelector('.btn-delete-product').addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        window.showConfirmModal(
          "Delete Product", 
          "Are you sure you want to permanently delete this product from the inventory?", 
          async () => {
            try {
              await window.api.products.delete(id);
              window.showToast("Product deleted successfully!", "success");
              renderProductsTable(); // reload
            } catch (err) {
              console.error(err);
              window.showToast(err.message || "Failed to delete product", "error");
            }
          }
        );
      });

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Products render error", err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger);">Failed to load products listing.</td></tr>`;
  }
}

// Format slugs
function formatSlugName(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
