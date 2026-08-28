// TechZone Mobile Accessories - Admin Categories Controller

let categoryImage = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with auth checks
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      initializeCategoriesPage();
    }
  }, 100);
});

function initializeCategoriesPage() {
  // Render listing
  renderCategoriesTable();

  // Bind Form Events
  setupCategoryEvents();
}

async function renderCategoriesTable() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  try {
    const categories = await window.api.categories.getAll({ all: true });
    tbody.innerHTML = '';

    if (categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">No categories defined yet.</td></tr>`;
      return;
    }

    categories.forEach(cat => {
      const isChecked = cat.status === 'active' ? 'checked' : '';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Image">
          <img src="${cat.image}" alt="${cat.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 1px solid var(--border-admin);" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
        </td>
        <td data-label="Name" style="font-weight: 700;">${cat.name}</td>
        <td data-label="Slug" style="font-family:monospace; font-size:0.8rem;">${cat.slug}</td>
        <td data-label="Status">
          <label class="admin-switch">
            <input type="checkbox" class="cat-status-toggle" data-id="${cat.id}" ${isChecked}>
            <span class="admin-slider"></span>
          </label>
        </td>
        <td data-label="Actions">
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm btn-edit-cat" data-id="${cat.id}" style="padding:6px 10px; font-size:0.75rem;" title="Edit Category"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-outline btn-sm btn-delete-cat" data-id="${cat.id}" style="padding:6px 10px; font-size:0.75rem;" title="Delete Category"><i class="fa-solid fa-trash-can" style="color:var(--danger);"></i></button>
          </div>
        </td>
      `;

      // Status Switch Handler
      row.querySelector('.cat-status-toggle').addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.checked ? 'active' : 'inactive';
        try {
          await window.api.categories.save({
            id: id,
            status: newStatus
          });
          window.showToast("Category status updated!", "success");
        } catch (err) {
          console.error(err);
          e.target.checked = !e.target.checked;
          window.showToast("Failed to update status", "error");
        }
      });

      // Edit Button Handler
      row.querySelector('.btn-edit-cat').addEventListener('click', () => {
        prefillCategoryForm(cat);
      });

      // Delete Button Handler
      row.querySelector('.btn-delete-cat').addEventListener('click', () => {
        window.showConfirmModal(
          "Delete Category", 
          `Are you sure you want to delete category "${cat.name}"? This will not delete products under it but will hide them from category browse options.`,
          async () => {
            try {
              await window.api.categories.delete(cat.id);
              window.showToast("Category deleted successfully!", "success");
              renderCategoriesTable();
              resetCategoryForm();
            } catch (err) {
              console.error(err);
              window.showToast("Failed to delete category", "error");
            }
          }
        );
      });

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Categories render error", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load categories.</td></tr>`;
  }
}

function prefillCategoryForm(cat) {
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-desc').value = cat.description || '';
  document.getElementById('cat-image-url').value = cat.image.startsWith('data:') ? '' : cat.image;
  document.getElementById('cat-status-active').checked = cat.status === 'active';
  
  categoryImage = cat.image;
  renderImagePreview(cat.image);

  document.getElementById('category-form-title').textContent = `Edit Category: ${cat.name}`;
  document.getElementById('btn-cancel-edit-category').style.display = 'inline-block';
}

function setupCategoryEvents() {
  const uploadCard = document.getElementById('cat-upload-trigger-card');
  const fileInput = document.getElementById('cat-file-input');

  if (uploadCard && fileInput) {
    uploadCard.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });
    
    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileInput.value = ''; // clear value cache immediately to prevent duplicate runs

      try {
        const base64Str = await window.api.uploadImage(file);
        categoryImage = base64Str;
        renderImagePreview(base64Str);
        document.getElementById('cat-image-url').value = ''; // clear url input if file uploaded
        window.showToast("Icon uploaded successfully!", "success");
      } catch (err) {
        window.showToast(err.message, "error");
      }
    });
  }

  // Cancel Edit button
  const cancelBtn = document.getElementById('btn-cancel-edit-category');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetCategoryForm);
  }

  // Form Submit Action
  const form = document.getElementById('admin-category-form');
  if (form) {
    form.addEventListener('submit', handleCategoryFormSubmit);
  }
}

function renderImagePreview(src) {
  const container = document.getElementById('cat-preview-box-container');
  if (!container) return;

  if (!src) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="preview-thumb-box" style="width: 70px; height: 70px; border-radius: 50%;">
      <img src="${src}" alt="Category Icon" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
      <button type="button" class="preview-thumb-delete" id="btn-delete-cat-preview" title="Delete Image"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;

  document.getElementById('btn-delete-cat-preview').onclick = () => {
    categoryImage = '';
    container.innerHTML = '';
  };
}

function resetCategoryForm() {
  document.getElementById('admin-category-form').reset();
  document.getElementById('cat-id').value = '';
  categoryImage = '';
  renderImagePreview('');

  document.getElementById('category-form-title').textContent = "Add New Category";
  document.getElementById('btn-cancel-edit-category').style.display = 'none';
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('cat-id').value;
  const name = document.getElementById('cat-name').value.trim();
  const desc = document.getElementById('cat-desc').value.trim();
  const urlInput = document.getElementById('cat-image-url').value.trim();
  const status = document.getElementById('cat-status-active').checked ? 'active' : 'inactive';

  // Settle image source priority: file upload > url input
  const image = categoryImage || urlInput;

  if (!image) {
    window.showToast("Please upload an image or paste a valid link URL.", "error");
    return;
  }

  const payload = {
    name,
    description: desc,
    image,
    status
  };

  if (id) {
    payload.id = id;
  }

  try {
    const saveBtn = document.getElementById('btn-submit-category-form');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Category...';

    await window.api.categories.save(payload);
    
    window.showToast(`Category ${id ? 'updated' : 'added'} successfully!`, "success");
    
    // Reset Form
    resetCategoryForm();
    
    // Reload table
    renderCategoriesTable();

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Category';

  } catch (err) {
    console.error(err);
    window.showToast("Failed to save category details.", "error");
    
    const saveBtn = document.getElementById('btn-submit-category-form');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Category';
  }
}
