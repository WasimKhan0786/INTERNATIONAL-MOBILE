// TechZone Mobile Accessories - Add/Edit Product Form Controller

let isEditMode = false;
let editProductId = null;
let uploadedImages = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with auth checks
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      initializeProductForm();
    }
  }, 100);
});

async function initializeProductForm() {
  // 1. Fetch Categories for select list
  await loadCategoriesSelect();

  // 2. Parse URL parameters to check edit mode
  const params = new URLSearchParams(window.location.search);
  editProductId = params.get('id');
  isEditMode = !!editProductId;

  if (isEditMode) {
    document.getElementById('form-page-title').textContent = "Edit Mobile Accessory Details";
    document.title = `Edit Product | TechZone`;
    await prefillProductData(editProductId);
  } else {
    // Add 1 default spec row to start with for ease of entry
    addSpecRow('', '');
  }

  // 3. Bind events
  setupFormEvents();
}

async function loadCategoriesSelect() {
  const select = document.getElementById('prod-category');
  if (!select) return;

  try {
    const categories = await window.api.categories.getAll();
    select.innerHTML = '<option value="">Select Category</option>' +
      categories.map(cat => `<option value="${cat.slug}">${cat.name}</option>`).join('');
  } catch (err) {
    console.error("Failed to load select categories", err);
  }
}

async function prefillProductData(id) {
  try {
    const product = await window.api.products.getById(id);
    
    // Fill text inputs
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-brand').value = product.brand;
    document.getElementById('prod-sku').value = product.sku || '';
    document.getElementById('prod-category').value = product.categorySlug;
    document.getElementById('prod-stock').value = product.stock;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-discount-price').value = product.discountPrice || '';
    const pieceInput = document.getElementById('prod-price-per-piece');
    if (pieceInput) pieceInput.value = product.pricePerPiece || '';
    document.getElementById('prod-desc').value = product.description;
    document.getElementById('prod-tags').value = product.tags ? product.tags.join(', ') : '';

    // Switches
    document.getElementById('prod-flag-featured').checked = !!product.featured;
    document.getElementById('prod-flag-bestseller').checked = !!product.bestseller;
    document.getElementById('prod-flag-newarrival').checked = !!product.newArrival;
    document.getElementById('prod-status-active').checked = product.status === 'active';

    // Specs
    if (product.specifications && product.specifications.length > 0) {
      product.specifications.forEach(spec => {
        addSpecRow(spec.name, spec.value);
      });
    } else {
      addSpecRow('', '');
    }

    // Images
    uploadedImages = product.images || [];
    renderImagePreviews();

  } catch (err) {
    console.error("Prefill error", err);
    window.showToast("Failed to retrieve product info for editing", "error");
    setTimeout(() => {
      window.location.href = 'products.html';
    }, 1500);
  }
}

function setupFormEvents() {
  // Specs builder row click
  document.getElementById('btn-add-spec-row').addEventListener('click', () => {
    addSpecRow('', '');
  });

  // Pasting Image URL Option
  document.getElementById('btn-add-image-url').addEventListener('click', () => {
    const urlInput = document.getElementById('prod-image-url-input');
    const url = urlInput.value.trim();
    
    if (!url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      window.showToast("Please enter a valid HTTP/HTTPS image link URL", "error");
      return;
    }

    uploadedImages.push(url);
    renderImagePreviews();
    urlInput.value = '';
    window.showToast("Image link added successfully!", "success");
  });

  // File Upload trigger click
  const uploadCard = document.getElementById('upload-files-trigger-card');
  const fileInput = document.getElementById('prod-file-input');

  if (uploadCard && fileInput) {
    uploadCard.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });
    
    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      fileInput.value = ''; // clear input cache immediately to prevent duplicate runs

      let successCount = 0;
      let errorMsgs = [];

      for (const file of files) {
        try {
          // Convert file to Base64
          const base64Str = await window.api.uploadImage(file);
          uploadedImages.push(base64Str);
          successCount++;
        } catch (err) {
          errorMsgs.push(err.message);
        }
      }

      if (successCount > 0) {
        renderImagePreviews();
        window.showToast(`Uploaded ${successCount} image(s) successfully!`, "success");
      }
      if (errorMsgs.length > 0) {
        window.showToast(errorMsgs[0], "error");
      }
    });
  }

  // Form Submit Action
  document.getElementById('admin-product-form').addEventListener('submit', handleFormSubmit);
}

// Dynamically create spec name/value input rows
function addSpecRow(name = '', value = '') {
  const container = document.getElementById('specs-builder-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'spec-builder-row';
  row.innerHTML = `
    <input type="text" placeholder="Spec Name (e.g. Color)" class="spec-name-input" value="${name}" style="padding: 8px 12px; border: 1px solid var(--border-admin); border-radius: var(--border-radius-sm);">
    <input type="text" placeholder="Spec Value (e.g. Frosted Black)" class="spec-val-input" value="${value}" style="padding: 8px 12px; border: 1px solid var(--border-admin); border-radius: var(--border-radius-sm);">
    <button type="button" class="btn btn-outline btn-sm btn-delete-spec-row" style="color:var(--danger); border-color:var(--border-admin); padding: 8px 12px;"><i class="fa-solid fa-trash-can"></i></button>
  `;

  row.querySelector('.btn-delete-spec-row').onclick = () => {
    row.remove();
  };

  container.appendChild(row);
}

// Render image thumbnails in previews panel
function renderImagePreviews() {
  const container = document.getElementById('prod-images-previews-container');
  if (!container) return;

  container.innerHTML = '';

  uploadedImages.forEach((imgSrc, idx) => {
    const box = document.createElement('div');
    box.className = 'preview-thumb-box';
    const displaySrc = imgSrc && imgSrc.url ? imgSrc.url : imgSrc;
    box.innerHTML = `
      <img src="${displaySrc}" alt="Preview image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
      <button type="button" class="preview-thumb-delete" data-index="${idx}" title="Delete Image"><i class="fa-solid fa-xmark"></i></button>
    `;

    box.querySelector('.preview-thumb-delete').onclick = (e) => {
      const deleteIdx = parseInt(e.currentTarget.dataset.index);
      uploadedImages.splice(deleteIdx, 1);
      renderImagePreviews();
    };

    container.appendChild(box);
  });
}

// Form submit action
async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const brand = document.getElementById('prod-brand').value.trim();
  const sku = document.getElementById('prod-sku').value.trim();
  const categorySlug = document.getElementById('prod-category').value;
  const stock = parseInt(document.getElementById('prod-stock').value);
  const price = parseFloat(document.getElementById('prod-price').value);
  
  const discountIn = document.getElementById('prod-discount-price').value;
  const discountPrice = discountIn ? parseFloat(discountIn) : null;

  const pieceInputEl = document.getElementById('prod-price-per-piece');
  const pricePerPieceIn = pieceInputEl ? pieceInputEl.value : null;
  const pricePerPiece = pricePerPieceIn ? parseFloat(pricePerPieceIn) : null;

  const description = document.getElementById('prod-desc').value.trim();
  const tagsStr = document.getElementById('prod-tags').value.trim();
  
  // Format tags array
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  // Specs compilation
  const specRows = document.querySelectorAll('.spec-builder-row');
  const specifications = [];
  specRows.forEach(row => {
    const key = row.querySelector('.spec-name-input').value.trim();
    const val = row.querySelector('.spec-val-input').value.trim();
    if (key && val) {
      specifications.push({ name: key, value: val });
    }
  });

  // Images are optional, default to empty array if none provided
  const images = uploadedImages || [];

  // Toggles check states
  const featured = document.getElementById('prod-flag-featured').checked;
  const bestseller = document.getElementById('prod-flag-bestseller').checked;
  const newArrival = document.getElementById('prod-flag-newarrival').checked;
  const status = document.getElementById('prod-status-active').checked ? 'active' : 'inactive';

  // Construct payload
  const productPayload = {
    name,
    brand,
    sku,
    categorySlug,
    stock,
    price,
    discountPrice,
    pricePerPiece,
    description,
    tags,
    specifications,
    images,
    featured,
    bestseller,
    newArrival,
    status
  };

  // If in Edit mode, assign existing ID
  if (isEditMode) {
    productPayload.id = editProductId;
  }

  try {
    const saveBtn = document.getElementById('btn-submit-product-form');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving Product...';
    }

    await window.api.products.save(productPayload);
    
    window.showToast(`Product ${isEditMode ? 'updated' : 'added'} successfully!`, "success");

    setTimeout(() => {
      window.location.href = 'products.html';
    }, 1200);

  } catch (err) {
    console.error(err);
    window.showToast(err.message || "Failed to save product details.", "error");
    
    const saveBtn = document.getElementById('btn-submit-product-form');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
    }
  }
}
