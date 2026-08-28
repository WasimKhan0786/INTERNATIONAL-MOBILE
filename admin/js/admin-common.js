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

  // 2. Inject Top Header
  let headerEl = document.querySelector('.admin-header');
  if (headerEl) {
    const pageTitle = document.title.split('|')[0].trim() || 'Admin Panel';
    headerEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="admin-menu-trigger" id="admin-drawer-open" aria-label="Open navigation menu"><i class="fa-solid fa-bars"></i></button>
        <h1 class="admin-header-title">${pageTitle}</h1>
      </div>
      <div class="admin-header-actions">
        <a href="../frontend/index.html" class="btn btn-outline btn-sm admin-view-site-btn" target="_blank" style="padding: 6px 12px; font-size: 0.8rem;"><i class="fa-solid fa-globe"></i> <span>View Site</span></a>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
            A
          </div>
          <span class="admin-profile-name">Admin</span>
        </div>
      </div>
    `;
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

