// TechZone Mobile Accessories - Admin Banners Controller

let bannerImage = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Sync page load with auth checks
  const checkSession = setInterval(async () => {
    const session = await window.api.auth.me();
    if (session) {
      clearInterval(checkSession);
      initializeBannersPage();
    }
  }, 100);
});

function initializeBannersPage() {
  // Render Banners List Table
  renderBannersTable();

  // Setup Form Events
  setupBannerEvents();
}

async function renderBannersTable() {
  const tbody = document.getElementById('admin-banners-tbody');
  if (!tbody) return;

  try {
    const banners = await window.api.banners.getAll({ all: true });
    tbody.innerHTML = '';

    if (banners.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px 0;">No banners defined yet.</td></tr>`;
      return;
    }

    banners.forEach(slide => {
      const isChecked = slide.status === 'active' ? 'checked' : '';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Image">
          <img src="${slide.image}" alt="${slide.title}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-admin);" onerror="this.src='https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80'">
        </td>
        <td data-label="Slide Title" style="font-weight: 700;">${slide.title}</td>
        <td data-label="Order" style="font-weight: 700;">${slide.order || 1}</td>
        <td data-label="Status">
          <label class="admin-switch">
            <input type="checkbox" class="banner-status-toggle" data-id="${slide.id}" ${isChecked}>
            <span class="admin-slider"></span>
          </label>
        </td>
        <td data-label="Actions">
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm btn-edit-banner" data-id="${slide.id}" style="padding:6px 10px; font-size:0.75rem;" title="Edit Slide"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-outline btn-sm btn-delete-banner" data-id="${slide.id}" style="padding:6px 10px; font-size:0.75rem;" title="Delete Slide"><i class="fa-solid fa-trash-can" style="color:var(--danger);"></i></button>
          </div>
        </td>
      `;

      // Status Switch Handler
      row.querySelector('.banner-status-toggle').addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.checked ? 'active' : 'inactive';
        try {
          await window.api.banners.save({
            id: id,
            status: newStatus
          });
          window.showToast("Banner status updated!", "success");
        } catch (err) {
          console.error(err);
          e.target.checked = !e.target.checked;
          window.showToast("Failed to update status", "error");
        }
      });

      // Edit Button Handler
      row.querySelector('.btn-edit-banner').addEventListener('click', () => {
        prefillBannerForm(slide);
      });

      // Delete Button Handler
      row.querySelector('.btn-delete-banner').addEventListener('click', () => {
        window.showConfirmModal(
          "Delete Slide", 
          `Are you sure you want to delete banner slide "${slide.title}"?`,
          async () => {
            try {
              await window.api.banners.delete(slide.id);
              window.showToast("Banner slide deleted successfully!", "success");
              renderBannersTable();
              resetBannerForm();
            } catch (err) {
              console.error(err);
              window.showToast("Failed to delete banner", "error");
            }
          }
        );
      });

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error("Banners list error", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to load banners.</td></tr>`;
  }
}

function prefillBannerForm(slide) {
  document.getElementById('banner-id').value = slide.id;
  document.getElementById('banner-title').value = slide.title;
  document.getElementById('banner-subtitle').value = slide.subtitle;
  document.getElementById('banner-btn-text').value = slide.buttonText || '';
  document.getElementById('banner-btn-url').value = slide.buttonUrl || '';
  document.getElementById('banner-badge').value = slide.discountBadge || '';
  document.getElementById('banner-order').value = slide.order || 1;
  document.getElementById('banner-image-url').value = slide.image.startsWith('data:') ? '' : slide.image;
  document.getElementById('banner-status-active').checked = slide.status === 'active';

  bannerImage = slide.image;
  renderImagePreview(slide.image);

  document.getElementById('banner-form-title').textContent = "Edit Carousel Slide";
  document.getElementById('btn-cancel-edit-banner').style.display = 'inline-block';
}

function setupBannerEvents() {
  const uploadCard = document.getElementById('banner-upload-trigger-card');
  const fileInput = document.getElementById('banner-file-input');

  if (uploadCard && fileInput) {
    uploadCard.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const base64Str = await window.api.uploadImage(file);
        bannerImage = base64Str;
        renderImagePreview(base64Str);
        document.getElementById('banner-image-url').value = ''; // clear url input if file uploaded
        window.showToast("Slide image uploaded successfully!", "success");
      } catch (err) {
        window.showToast(err.message, "error");
      }
      
      fileInput.value = ''; // clear value cache
    });
  }

  // Cancel Edit button
  const cancelBtn = document.getElementById('btn-cancel-edit-banner');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetBannerForm);
  }

  // Form Submit Action
  const form = document.getElementById('admin-banner-form');
  if (form) {
    form.addEventListener('submit', handleBannerFormSubmit);
  }
}

function renderImagePreview(src) {
  const container = document.getElementById('banner-preview-box-container');
  if (!container) return;

  if (!src) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="preview-thumb-box" style="width: 120px; height: 60px;">
      <img src="${src}" alt="Banner Preview" onerror="this.src='https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80'">
      <button type="button" class="preview-thumb-delete" id="btn-delete-banner-preview" title="Delete Image"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;

  document.getElementById('btn-delete-banner-preview').onclick = () => {
    bannerImage = '';
    container.innerHTML = '';
  };
}

function resetBannerForm() {
  document.getElementById('admin-banner-form').reset();
  document.getElementById('banner-id').value = '';
  bannerImage = '';
  renderImagePreview('');

  document.getElementById('banner-form-title').textContent = "Add Carousel Slide";
  document.getElementById('btn-cancel-edit-banner').style.display = 'none';
}

async function handleBannerFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('banner-id').value;
  const title = document.getElementById('banner-title').value.trim();
  const subtitle = document.getElementById('banner-subtitle').value.trim();
  const btnText = document.getElementById('banner-btn-text').value.trim();
  const btnUrl = document.getElementById('banner-btn-url').value.trim();
  const badge = document.getElementById('banner-badge').value.trim();
  const order = parseInt(document.getElementById('banner-order').value);
  const urlInput = document.getElementById('banner-image-url').value.trim();
  const status = document.getElementById('banner-status-active').checked ? 'active' : 'inactive';

  const image = bannerImage || urlInput;

  if (!image) {
    window.showToast("Please upload an image or paste a valid link URL.", "error");
    return;
  }

  const payload = {
    title,
    subtitle,
    buttonText: btnText,
    buttonUrl: btnUrl,
    discountBadge: badge,
    order,
    image,
    status
  };

  if (id) {
    payload.id = id;
  }

  try {
    const saveBtn = document.getElementById('btn-submit-banner-form');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Banner...';

    await window.api.banners.save(payload);
    
    window.showToast(`Banner slide ${id ? 'updated' : 'added'} successfully!`, "success");
    
    // Reset Form
    resetBannerForm();
    
    // Reload table
    renderBannersTable();

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Banner';

  } catch (err) {
    console.error(err);
    window.showToast("Failed to save banner slide.", "error");
    
    const saveBtn = document.getElementById('btn-submit-banner-form');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Banner';
  }
}
