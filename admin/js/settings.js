// TechZone Mobile Accessories - Admin Settings Controller

let logoImage = '';
let faviconImage = '';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.api.auth.me();
  if (session) {
    initializeSettingsPage();
  } else {
    window.location.href = 'login.html';
  }
});

async function initializeSettingsPage() {
  // 1. Pre-fill settings form
  await loadSettings();

  // 2. Bind uploader file changes
  setupSettingsUploads();

  // 3. Bind form submit
  document.getElementById('admin-settings-form').addEventListener('submit', handleSaveSettingsSubmit);
}

async function loadSettings() {
  try {
    const settings = await window.api.settings.get();

    // Fill inputs
    document.getElementById('set-shopname').value = settings.shopName;
    document.getElementById('set-tagline').value = settings.tagline;
    document.getElementById('set-logo-url').value = settings.logo.startsWith('data:') ? '' : settings.logo;
    document.getElementById('set-favicon-url').value = settings.favicon.startsWith('data:') ? '' : settings.favicon;
    
    document.getElementById('set-phone').value = settings.phone;
    document.getElementById('set-whatsapp').value = settings.whatsapp;
    document.getElementById('set-email').value = settings.email;
    document.getElementById('set-hours').value = settings.openingHours;
    document.getElementById('set-address').value = settings.address;

    document.getElementById('set-instagram').value = settings.socialInstagram || '';
    document.getElementById('set-facebook').value = settings.socialFacebook || '';
    document.getElementById('set-youtube').value = settings.socialYoutube || '';
    document.getElementById('set-telegram').value = settings.socialTelegram || '';

    document.getElementById('set-deliverycharge').value = settings.deliveryCharge;
    document.getElementById('set-threshold').value = settings.freeDeliveryThreshold;
    document.getElementById('set-currency').value = settings.currency || '₹';

    document.getElementById('set-color-primary').value = settings.themeColor || '#ff5722';
    document.getElementById('set-color-secondary').value = settings.secondaryColor || '#1e1e24';

    // Festival Mode details
    document.getElementById('set-festival-active').checked = settings.festivalModeActive === true;
    document.getElementById('set-festival-title').value = settings.festivalTitle || '';
    document.getElementById('set-festival-badge').value = settings.festivalDiscountBadge || '';
    document.getElementById('set-festival-subtitle').value = settings.festivalSubtitle || '';

    // Flash Sale Mode details
    document.getElementById('set-flash-active').checked = settings.flashSaleActive === true;
    document.getElementById('set-flash-title').value = settings.flashSaleTitle || '';
    document.getElementById('set-flash-badge').value = settings.flashSaleDiscountBadge || '';
    document.getElementById('set-flash-subtitle').value = settings.flashSaleSubtitle || '';
    
    if (settings.flashSaleEndTime) {
      try {
        const dt = new Date(settings.flashSaleEndTime);
        const isoStr = new Date(dt.getTime() - (dt.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('set-flash-endtime').value = isoStr;
      } catch (e) {
        document.getElementById('set-flash-endtime').value = '';
      }
    }

    // Auth details (Keep empty by default so current credentials are preserved unless changed)
    document.getElementById('set-admin-email').value = '';
    document.getElementById('set-admin-password').value = '';

    // Image previews
    logoImage = settings.logo;
    faviconImage = settings.favicon;
    renderPreviewImage('logo-preview-container', logoImage, 'logo');
    renderPreviewImage('favicon-preview-container', faviconImage, 'favicon');

  } catch (err) {
    console.error("Settings loading error", err);
    window.showToast("Failed to load settings from database.", "error");
  }
}

function setupSettingsUploads() {
  const logoFile = document.getElementById('set-logo-file');
  const faviconFile = document.getElementById('set-favicon-file');

  if (logoFile) {
    logoFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const base64Str = await window.api.uploadImage(file);
        logoImage = base64Str;
        renderPreviewImage('logo-preview-container', base64Str, 'logo');
        document.getElementById('set-logo-url').value = ''; // clear text url
        window.showToast("Logo uploaded successfully!", "success");
      } catch (err) {
        window.showToast(err.message, "error");
      }
      logoFile.value = ''; // clear input cache
    });
  }

  if (faviconFile) {
    faviconFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const base64Str = await window.api.uploadImage(file);
        faviconImage = base64Str;
        renderPreviewImage('favicon-preview-container', base64Str, 'favicon');
        document.getElementById('set-favicon-url').value = ''; // clear text url
        window.showToast("Favicon uploaded successfully!", "success");
      } catch (err) {
        window.showToast(err.message, "error");
      }
      faviconFile.value = ''; // clear input cache
    });
  }
}

function renderPreviewImage(containerId, src, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!src) {
    container.innerHTML = '';
    return;
  }

  const isFavicon = type === 'favicon';
  const sizeStyle = isFavicon ? 'width:32px; height:32px;' : 'width:120px; height:50px;';

  container.innerHTML = `
    <div class="preview-thumb-box" style="${sizeStyle} border-radius:4px; position:relative;">
      <img src="${src}" alt="${type} preview" style="width:100%; height:100%; object-fit:contain;">
      <button type="button" class="preview-thumb-delete" id="btn-delete-${type}-preview" title="Delete Image" style="width:18px; height:18px; font-size:0.6rem;"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `;

  document.getElementById(`btn-delete-${type}-preview`).onclick = () => {
    if (type === 'logo') {
      logoImage = '';
    } else {
      faviconImage = '';
    }
    container.innerHTML = '';
  };
}

async function handleSaveSettingsSubmit(e) {
  e.preventDefault();

  const shopName = document.getElementById('set-shopname').value.trim();
  const tagline = document.getElementById('set-tagline').value.trim();
  const logoUrl = document.getElementById('set-logo-url').value.trim();
  const faviconUrl = document.getElementById('set-favicon-url').value.trim();

  const phone = document.getElementById('set-phone').value.trim();
  const whatsapp = document.getElementById('set-whatsapp').value.trim();
  const email = document.getElementById('set-email').value.trim();
  const openingHours = document.getElementById('set-hours').value.trim();
  const address = document.getElementById('set-address').value.trim();

  const socialInstagram = document.getElementById('set-instagram').value.trim();
  const socialFacebook = document.getElementById('set-facebook').value.trim();
  const socialYoutube = document.getElementById('set-youtube').value.trim();
  const socialTelegram = document.getElementById('set-telegram').value.trim();

  const deliveryCharge = parseFloat(document.getElementById('set-deliverycharge').value);
  const freeDeliveryThreshold = parseFloat(document.getElementById('set-threshold').value);
  const currency = document.getElementById('set-currency').value.trim();

  const themeColor = document.getElementById('set-color-primary').value;
  const secondaryColor = document.getElementById('set-color-secondary').value;

  const festivalModeActive = document.getElementById('set-festival-active').checked;
  const festivalTitle = document.getElementById('set-festival-title').value.trim();
  const festivalDiscountBadge = document.getElementById('set-festival-badge').value.trim();
  const festivalSubtitle = document.getElementById('set-festival-subtitle').value.trim();

  const flashSaleActive = document.getElementById('set-flash-active').checked;
  const flashSaleTitle = document.getElementById('set-flash-title').value.trim();
  const flashSaleDiscountBadge = document.getElementById('set-flash-badge').value.trim();
  const flashSaleSubtitle = document.getElementById('set-flash-subtitle').value.trim();
  const flashSaleEndTimeInput = document.getElementById('set-flash-endtime').value;
  const flashSaleEndTime = flashSaleEndTimeInput ? new Date(flashSaleEndTimeInput).toISOString() : '';

  const adminEmail = document.getElementById('set-admin-email').value.trim();
  const adminPassword = document.getElementById('set-admin-password').value;

  // Priortise uploads over URL inputs
  const logo = logoImage || logoUrl;
  const favicon = faviconImage || faviconUrl;

  if (!logo) {
    window.showToast("Please upload a logo image file or paste a link URL.", "error");
    return;
  }
  if (!favicon) {
    window.showToast("Please upload a favicon image file or paste a link URL.", "error");
    return;
  }

  const payload = {
    shopName,
    tagline,
    logo,
    favicon,
    phone,
    whatsapp,
    email,
    openingHours,
    address,
    socialInstagram,
    socialFacebook,
    socialYoutube,
    socialTelegram,
    deliveryCharge,
    freeDeliveryThreshold,
    currency,
    themeColor,
    secondaryColor,
    festivalModeActive,
    festivalTitle,
    festivalDiscountBadge,
    festivalSubtitle,
    flashSaleActive,
    flashSaleTitle,
    flashSaleDiscountBadge,
    flashSaleSubtitle,
    flashSaleEndTime
  };

  // Only include admin credentials if explicitly entered by the user
  if (adminEmail) {
    payload.adminEmail = adminEmail;
  }
  if (adminPassword) {
    payload.adminPassword = adminPassword;
  }

  try {
    const saveBtn = document.getElementById('btn-save-settings');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Settings...';

    // Save Settings
    await window.api.settings.save(payload);
    
    // Dynamic color check
    document.documentElement.style.setProperty('--primary-color', themeColor);
    document.documentElement.style.setProperty('--secondary-color', secondaryColor);

    window.showToast("Settings saved and updated successfully!", "success");

    // Force page reload after a short delay to apply changes globally
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (err) {
    console.error(err);
    window.showToast("Failed to save settings.", "error");
    
    const saveBtn = document.getElementById('btn-save-settings');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Website Settings';
  }
}
