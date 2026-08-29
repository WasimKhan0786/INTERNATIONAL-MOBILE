// TechZone Mobile Accessories - Shared Admin Script (Auth Guard & UI Injector)

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard Check
  const session = await window.api.auth.me();
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('login.html');

  if (!session && !isLoginPage) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }

  if (session && isLoginPage) {
    // Redirect to dashboard if already logged in
    window.location.href = 'dashboard.html';
    return;
  }

  // If logged in, inject Layout (Sidebar & Header)
  if (session) {
    const settings = await window.api.settings.get();
    injectAdminLayout(session, settings);
    setupAdminDrawer();
  }
});

// Inject common layout into page
function injectAdminLayout(session, settings) {
  // 1. Inject Sidebar Container
  let sidebarEl = document.querySelector('.admin-sidebar');
  if (sidebarEl) {
    const path = window.location.pathname;
    const isFile = (file) => path.endsWith(file);
    const isActive = (file) => isFile(file) ? 'active' : '';

    const isProductsActive = isFile('products.html') || isFile('add-product.html') || isFile('edit-product.html') ? 'active' : '';

    sidebarEl.innerHTML = `
      <div class="admin-sidebar-header">
        ${(settings.shopName || 'Admin').split(' ')[0]} <span>Admin</span>
        <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close navigation drawer"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <ul class="admin-sidebar-menu">
        <li><a href="dashboard.html" class="admin-menu-link ${isActive('dashboard.html')}"><i class="fa-solid fa-chart-line"></i> Dashboard</a></li>
        <li><a href="products.html" class="admin-menu-link ${isProductsActive}"><i class="fa-solid fa-boxes-stacked"></i> Products</a></li>
        <li><a href="categories.html" class="admin-menu-link ${isActive('categories.html')}"><i class="fa-solid fa-tags"></i> Categories</a></li>
        <li><a href="orders.html" class="admin-menu-link ${isActive('orders.html')}"><i class="fa-solid fa-receipt"></i> Orders</a></li>
        <li><a href="banners.html" class="admin-menu-link ${isActive('banners.html')}"><i class="fa-solid fa-images"></i> Home Banners</a></li>
        <li><a href="settings.html" class="admin-menu-link ${isActive('settings.html')}"><i class="fa-solid fa-sliders"></i> Settings</a></li>
        <li style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <a href="#" id="admin-logout-trigger" class="admin-menu-link"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        </li>
      </ul>
    `;

    // Bind Logout action
    const logoutBtn = document.getElementById('admin-logout-trigger');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.showConfirmModal("Confirm Logout", "Are you sure you want to log out of the admin panel?", async () => {
          await window.api.auth.logout();
          window.location.href = 'login.html';
        });
      });
    }
  }

  // 2. Inject Top Header with Interactive Profile Customization Dropdown
  let headerEl = document.querySelector('.admin-header');
  if (headerEl) {
    const pageTitle = document.title.split('|')[0].trim() || 'Admin Panel';
    const adminName = session.admin ? (session.admin.name || 'Administrator') : 'Admin';
    const adminEmail = session.admin ? (session.admin.email || 'wasimkham7861@gmail.com') : '';
    const initialLetter = (adminName.charAt(0) || 'A').toUpperCase();
    const avatarPhoto = settings.adminAvatar || '';

    const avatarContentHtml = avatarPhoto
      ? `<img src="${avatarPhoto}" alt="Admin Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
      : initialLetter;

    headerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="admin-menu-trigger" id="admin-drawer-open" aria-label="Open navigation menu"><i class="fa-solid fa-bars"></i></button>
        <h1 class="admin-header-title">${pageTitle}</h1>
      </div>
      <div class="admin-header-actions">
        <a href="../frontend/index.html" class="btn btn-outline btn-sm admin-view-site-btn" target="_blank" style="padding: 6px 12px; font-size: 0.8rem;"><i class="fa-solid fa-globe"></i> <span>View Site</span></a>
        
        <!-- Interactive Profile Dropdown Wrapper -->
        <div class="admin-profile-dropdown-wrapper">
          <div class="admin-profile-toggle" id="admin-profile-toggle" title="Admin Profile & Customization Menu">
            <div class="admin-profile-avatar" id="header-avatar-circle">
              ${avatarContentHtml}
            </div>
            <span class="admin-profile-name">${adminName}</span>
            <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem; color: var(--text-muted);"></i>
          </div>

          <!-- Dropdown Popup Menu -->
          <div class="admin-profile-dropdown-menu" id="admin-profile-menu">
            <!-- Header User Card with Camera Upload Overlay -->
            <div class="profile-menu-header">
              <div class="admin-profile-avatar-container">
                <div class="admin-profile-avatar" id="dropdown-avatar-circle" style="width: 44px; height: 44px; font-size: 1.1rem;">
                  ${avatarContentHtml}
                </div>
                <label for="admin-avatar-file-input" class="avatar-upload-badge" title="Upload Custom Admin Photo">
                  <i class="fa-solid fa-camera"></i>
                  <input type="file" id="admin-avatar-file-input" accept="image/*" style="display:none;">
                </label>
              </div>
              <div style="flex-grow: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${adminName}</div>
                <div style="font-size: 0.73rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${adminEmail}</div>
                <span class="admin-badge admin-badge-success" style="font-size: 0.65rem; padding: 2px 6px; margin-top: 3px; display: inline-block;">Super Admin</span>
              </div>
            </div>

            <!-- Customization Section: Accent Colors -->
            <div style="padding: 4px 10px; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Accent Theme Color</div>
            <div class="theme-color-dots" style="margin-bottom: 6px;">
              <div class="theme-color-dot" data-color="#ff5722" style="background: #ff5722;" title="Orange (Default)"></div>
              <div class="theme-color-dot" data-color="#2563eb" style="background: #2563eb;" title="Royal Blue"></div>
              <div class="theme-color-dot" data-color="#059669" style="background: #059669;" title="Emerald Green"></div>
              <div class="theme-color-dot" data-color="#7c3aed" style="background: #7c3aed;" title="Deep Purple"></div>
              <div class="theme-color-dot" data-color="#db2777" style="background: #db2777;" title="Hot Pink"></div>
            </div>

            <div style="border-top: 1px solid var(--border-admin, #f3f4f6); margin: 6px 0;"></div>

            <!-- Quick Navigation & Customization Shortcuts -->
            <a href="settings.html" class="profile-menu-item">
              <i class="fa-solid fa-sliders" style="color: var(--primary-color);"></i>
              <span>Store Settings</span>
            </a>
            <a href="settings.html#admin-credentials" class="profile-menu-item">
              <i class="fa-solid fa-key" style="color: #f59e0b;"></i>
              <span>Change Password</span>
            </a>
            <a href="products.html" class="profile-menu-item">
              <i class="fa-solid fa-boxes-stacked" style="color: #3b82f6;"></i>
              <span>Manage Products</span>
            </a>
            <a href="/sitemap.xml" target="_blank" class="profile-menu-item">
              <i class="fa-solid fa-sitemap" style="color: #10b981;"></i>
              <span>View Sitemap.xml</span>
            </a>
            <a href="../frontend/index.html" target="_blank" class="profile-menu-item">
              <i class="fa-solid fa-globe" style="color: #8b5cf6;"></i>
              <span>Live Storefront</span>
            </a>

            <div style="border-top: 1px solid var(--border-admin, #f3f4f6); margin: 6px 0;"></div>

            <!-- Logout -->
            <button type="button" class="profile-menu-item" id="dropdown-logout-btn" style="color: var(--danger);">
              <i class="fa-solid fa-right-from-bracket"></i>
              <span>Logout Admin Panel</span>
            </button>
          </div>
        </div>

      </div>
    `;

    setupProfileDropdownHandlers();
  }
}

// Setup Admin Profile Dropdown Click & Color Customization Handlers
function setupProfileDropdownHandlers() {
  const toggleBtn = document.getElementById('admin-profile-toggle');
  const dropdownMenu = document.getElementById('admin-profile-menu');
  const logoutBtn = document.getElementById('dropdown-logout-btn');

  if (toggleBtn && dropdownMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  // Accent Color Customizer Dots
  const colorDots = document.querySelectorAll('.theme-color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedColor = dot.getAttribute('data-color');
      if (selectedColor) {
        document.documentElement.style.setProperty('--primary-color', selectedColor);
        localStorage.setItem('adminAccentColor', selectedColor);
        window.showToast("Accent theme color updated!", "success");
      }
    });
  });

  // Apply saved accent color if present
  const savedColor = localStorage.getItem('adminAccentColor');
  if (savedColor) {
    document.documentElement.style.setProperty('--primary-color', savedColor);
  }

  // Handle Admin Profile Photo Upload
  const avatarFileInput = document.getElementById('admin-avatar-file-input');
  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        window.showToast("Uploading profile photo...", "info");
        const base64Str = await window.api.uploadImage(file);

        // Fetch current settings to pass required fields if needed
        const currentSettings = await window.api.settings.get();
        await window.api.settings.save({
          shopName: currentSettings.shopName || 'INTERNATIONAL MOBILE',
          adminAvatar: base64Str
        });

        // Update all avatar circles in real time
        const avatarCircles = document.querySelectorAll('.admin-profile-avatar');
        avatarCircles.forEach(circle => {
          circle.innerHTML = `<img src="${base64Str}" alt="Admin Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        });

        window.showToast("Admin profile photo updated successfully!", "success");
      } catch (err) {
        console.error("Profile photo upload failed:", err);
        window.showToast(err.message || "Failed to upload profile photo.", "error");
      }
      avatarFileInput.value = ''; // Reset input cache
    });
  }

  // Logout from dropdown
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.showConfirmModal("Confirm Logout", "Are you sure you want to log out of the admin panel?", async () => {
        await window.api.auth.logout();
        window.location.href = 'login.html';
      });
    });
  }
}

// Sidebar Drawer toggles for Mobile Phones
function setupAdminDrawer() {
  const openBtn = document.getElementById('admin-drawer-open');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.querySelector('.admin-sidebar');
  
  let backdrop = document.querySelector('.admin-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'admin-backdrop';
    document.body.appendChild(backdrop);
  }

  const openDrawer = () => {
    if (sidebar) sidebar.classList.add('open-drawer');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    if (sidebar) sidebar.classList.remove('open-drawer');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };

  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  if (sidebar) {
    sidebar.querySelectorAll('.admin-menu-link').forEach(link => {
      if (!link.id || link.id !== 'admin-logout-trigger') {
        link.addEventListener('click', closeDrawer);
      }
    });
  }
}

