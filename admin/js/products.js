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
  // 1. Load category list and products grid sequentially
  await loadCategoryDropdown();
  await renderProductsTable();

  // 3. Bind search & filter inputs
  const searchInput = document.getElementById('admin-product-search');
  const catFilter = document.getElementById('admin-product-filter-category');
  const statusFilter = document.getElementById('admin-product-filter-status');
  const sortSelect = document.getElementById('admin-product-sort');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(renderProductsTable, 300));
  }
  if (catFilter) {
    catFilter.addEventListener('change', renderProductsTable);
  }
  if (statusFilter) {
    statusFilter.addEventListener('change', renderProductsTable);
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', renderProductsTable);
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

  const searchVal = document.getElementById('admin-product-search') ? document.getElementById('admin-product-search').value.trim() : '';
  const catVal = document.getElementById('admin-product-filter-category') ? document.getElementById('admin-product-filter-category').value : '';
  const statusVal = document.getElementById('admin-product-filter-status') ? document.getElementById('admin-product-filter-status').value : '';
  const sortVal = document.getElementById('admin-product-sort') ? document.getElementById('admin-product-sort').value : 'newest';

  try {
    let products = await window.api.products.getAll({
      all: true,
      search: searchVal,
      category: catVal,
      status: statusVal,
      sort: sortVal
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
      if (prod.newArrival || window.isRecentAddition(prod.createdAt)) highlights.push('<span class="admin-badge admin-badge-success" style="font-size:0.65rem; margin-bottom: 2px;">New</span>');
      
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
          <span class="admin-badge ${stockClass}">${prod.stock <= 0 ? 'Out of Stock' : `${prod.stock} Units`}</span>
        </td>
        <td data-label="Highlights">${highlightsHtml}</td>
        <td data-label="Status">
          <label class="admin-switch">
            <input type="checkbox" class="status-toggle-checkbox" data-id="${prod.id || prod._id}" ${isChecked}>
            <span class="admin-slider"></span>
          </label>
        </td>
        <td data-label="Actions">
          <div style="display: flex; gap: 8px;">
            <a href="edit-product.html?id=${prod.id || prod._id}" class="btn btn-outline btn-sm" style="padding:6px 10px; font-size:0.75rem;" title="Edit Product"><i class="fa-solid fa-pen"></i></a>
            <button class="btn btn-outline btn-sm btn-delete-product" data-id="${prod.id || prod._id}" style="padding:6px 10px; font-size:0.75rem;" title="Delete Product"><i class="fa-solid fa-trash-can" style="color:var(--danger);"></i></button>
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

// Bulk Import Handler
(function() {
  const modal = document.getElementById('bulk-import-modal');
  const triggerBtn = document.getElementById('btn-bulk-upload-trigger');
  const closeBtn = document.getElementById('bulk-import-modal-close');
  const dropZone = document.getElementById('csv-drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  const parsedInfo = document.getElementById('csv-parsed-info');
  const downloadTemplateBtn = document.getElementById('btn-download-template');
  const submitBtn = document.getElementById('btn-submit-import');

  let parsedProductsList = [];

  if (!modal) return;

  triggerBtn.addEventListener('click', () => {
    modal.classList.add('open');
    resetModalState();
  });

  const closeModal = () => {
    modal.classList.remove('open');
    resetModalState();
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function resetModalState() {
    parsedProductsList = [];
    if (fileInput) fileInput.value = '';
    parsedInfo.style.display = 'none';
    parsedInfo.innerHTML = '';
    submitBtn.disabled = true;
    dropZone.innerHTML = `
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <p><strong>Click to browse</strong> or drag & drop CSV file here</p>
      <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
    `;
    const newFileInput = dropZone.querySelector('#csv-file-input');
    newFileInput.addEventListener('change', handleFileSelect);
  }

  dropZone.addEventListener('click', (e) => {
    const input = dropZone.querySelector('#csv-file-input');
    if (e.target !== input) {
      input.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = dropZone.querySelector('#csv-file-input');
      input.files = files;
      handleFile(files[0]);
    }
  });

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
      window.showToast("Please upload a valid .csv file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      try {
        parsedProductsList = parseCSV(text);
        
        if (parsedProductsList.length === 0) {
          window.showToast("No products found in the CSV. Make sure headers are correct.", "warning");
          return;
        }

        parsedInfo.style.display = 'block';
        parsedInfo.innerHTML = `
          <div class="csv-file-info">
            <span><i class="fa-solid fa-circle-check"></i> ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
            <strong>${parsedProductsList.length} products found</strong>
          </div>
        `;
        
        dropZone.innerHTML = `
          <i class="fa-solid fa-file-csv" style="color: var(--success);"></i>
          <p style="color: var(--success); font-weight: 600;">File loaded successfully!</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">Click to change file</p>
          <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
        `;
        const newFileInput = dropZone.querySelector('#csv-file-input');
        newFileInput.addEventListener('change', handleFileSelect);

        submitBtn.disabled = false;
      } catch (err) {
        console.error(err);
        window.showToast("Failed to parse CSV file. Check formatting.", "error");
      }
    };
    reader.readAsText(file);
  }

  function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    
    if (lines.length === 0) return [];
    
    const headers = lines[0].map(h => h.trim().toLowerCase());
    const parsedProducts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      if (values.length < headers.length) continue;
      
      const p = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j] ? values[j].trim() : '';
        p[header] = value;
      }
      
      if (p.name) {
        parsedProducts.push({
          name: p.name,
          sku: p.sku || '',
          categorySlug: p.categoryslug || p.categorySlug || 'accessories',
          brand: p.brand || '',
          price: p.price ? parseFloat(p.price) : 0,
          discountPrice: p.discountprice || p.discountPrice ? parseFloat(p.discountprice || p.discountPrice) : null,
          stock: p.stock ? parseInt(p.stock, 10) : 0,
          tags: p.tags ? p.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
          description: p.description || '',
          images: p.images ? p.images.split(';').map(u => u.trim()).filter(Boolean) : []
        });
      }
    }
    return parsedProducts;
  }

  downloadTemplateBtn.addEventListener('click', () => {
    const headers = ['name', 'sku', 'categorySlug', 'brand', 'price', 'discountPrice', 'stock', 'tags', 'description', 'images'];
    const sampleData = [
      ['iPhone 15 Frosted Case', 'COV-IP15M-SP', 'accessories', 'Spigen', '1299', '699', '100', 'iphone 15 cover;spigen case;frosted cover', 'Ultra-thin protective cover with soft TPU bumper guards.', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302'],
      ['Samsung S24 Liquid Silicone Cover', 'COV-S24US-SM', 'accessories', 'Samsung', '1499', '899', '50', 's24 ultra cover;silicone case;soft cover', 'Silky-smooth soft liquid silicone cover protecting against drops and dirt.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe']
    ];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    sampleData.forEach(row => {
      const escapedRow = row.map(val => {
        const clean = val.replace(/"/g, '""');
        return clean.includes(',') || clean.includes('\n') ? `"${clean}"` : clean;
      });
      csvContent += escapedRow.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  submitBtn.addEventListener('click', async () => {
    if (parsedProductsList.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';

    try {
      const response = await window.api.products.bulkUpload(parsedProductsList);
      window.showToast(response.message || "Bulk import completed successfully!", "success");
      closeModal();
      renderProductsTable();
    } catch (err) {
      console.error(err);
      window.showToast(err.message || "Bulk import failed.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Import Products';
    }
  });
})();

// Debounce helper to prevent excessive API requests
function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
