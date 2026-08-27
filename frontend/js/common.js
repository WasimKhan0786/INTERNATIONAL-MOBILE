// TechZone Mobile Accessories - Shared Utilities & Layout Generator

// Cart Utilities
const cart = {
  get() {
    return JSON.parse(localStorage.getItem('tz_cart')) || [];
  },
  
  save(items) {
    localStorage.setItem('tz_cart', JSON.stringify(items));
    this.updateBadge();
    // Dispatch custom event to let other scripts know cart updated
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  },

  add(product, quantity = 1) {
    const items = this.get();
    const existingIndex = items.findIndex(item => item.id === product.id);
    
    if (product.stock <= 0) {
      window.showToast("Product is out of stock!", "error");
      return false;
    }

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        window.showToast(`Only ${product.stock} units in stock.`, "error");
        return false;
      }
      items[existingIndex].quantity = newQty;
    } else {
      if (quantity > product.stock) {
        window.showToast(`Only ${product.stock} units in stock.`, "error");
        return false;
      }
      items.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.discountPrice || product.price,
        image: product.images[0] ? (product.images[0].url || product.images[0]) : '',
        quantity: quantity,
        sku: product.sku
      });
    }
    
    this.save(items);
    window.showToast("Added to Cart successfully!", "success");
    return true;
  },

  update(productId, quantity) {
    let items = this.get();
    const index = items.findIndex(item => item.id === productId);
    if (index > -1) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      this.save(items);
    }
  },

  remove(productId) {
    let items = this.get();
    items = items.filter(item => item.id !== productId);
    this.save(items);
    window.showToast("Item removed from Cart.", "info");
  },

  clear() {
    this.save([]);
  },

  getCount() {
    const items = this.get();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal() {
    const items = this.get();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  updateBadge() {
    const count = this.getCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

// Global Helpers
window.showToast = (message, type = 'success') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
  if (type === 'info') icon = '<i class="fa-solid fa-circle-info"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger reflow to apply animation
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

window.showConfirmModal = (title, message, onConfirm) => {
  let overlay = document.querySelector('.modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">${title}</div>
      <div class="modal-body">${message}</div>
      <div class="modal-actions">
        <button class="btn btn-outline btn-sm modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary btn-sm modal-confirm-btn">Confirm</button>
      </div>
    </div>
  `;

  overlay.classList.add('show');

  const close = () => overlay.classList.remove('show');

  overlay.querySelector('.modal-cancel-btn').addEventListener('click', () => {
    close();
  });

  overlay.querySelector('.modal-confirm-btn').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    close();
  });
};

// Page Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = window.location.pathname.includes('/admin/');
  
  // Load Settings
  const settings = await window.api.settings.get();
  
  // Set styling variables dynamically
  document.documentElement.style.setProperty('--primary-color', settings.themeColor || '#ff5722');
  document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor || '#1e1e24');
  
  if (isAdmin) {
    return; // Stop customer storefront injections inside admin folder
  }
  
  // Update Favicon
  let faviconLink = document.querySelector("link[rel*='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'shortcut icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = settings.favicon;

  // Set Title suffix if page has title
  if (document.title) {
    if (!document.title.includes(settings.shopName)) {
      document.title = `${document.title} | ${settings.shopName}`;
    }
  } else {
    document.title = `${settings.shopName} - ${settings.tagline}`;
  }

  // Render Layout Components
  renderHeader(settings);
  renderFooter(settings);
  renderWhatsAppFloat(settings);
  
  // Setup sticky header effect
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Update initial cart badge count
  cart.updateBadge();
  
  // Initialize Search Bars
  initSearchEvent();
});

// Render Header HTML
function renderHeader(settings) {
  const headerEl = document.querySelector('header');
  if (!headerEl) return;

  const currentPath = window.location.pathname;
  const isPageActive = (path) => currentPath.endsWith(path) ? 'active' : '';

  headerEl.className = ''; // reset just in case
  headerEl.innerHTML = `
    <!-- Top Contact Bar -->
    <div class="header-top-bar" style="background-color: var(--secondary-color); color: rgba(255,255,255,0.85); font-size: 0.8rem; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 500; width: 100%;">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <i class="fa-solid fa-user-tie" style="color: var(--primary-color); margin-right: 5px;"></i> Prop. Hassan Siddiqui
        </div>
        <div style="display: flex; gap: 15px; align-items: center;">
          <a href="tel:7654085663" style="color: inherit; text-decoration: none;"><i class="fa-solid fa-phone" style="color: var(--primary-color); margin-right: 4px;"></i> 7654085663</a>
          <a href="tel:8789380072" style="color: inherit; text-decoration: none;"><i class="fa-solid fa-phone" style="color: var(--primary-color); margin-right: 4px;"></i> 8789380072</a>
        </div>
      </div>
    </div>
    
    <div class="container header-container" style="padding-top: 10px; padding-bottom: 10px;">
      <!-- Logo -->
      <a href="index.html" class="logo-link">
        <img src="${settings.logo}" alt="${settings.shopName}" class="logo-img" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
        <span class="logo-text">${settings.shopName.split(' ')[0]} <span>${settings.shopName.split(' ').slice(1).join(' ') || ''}</span></span>
      </a>

      <!-- Desktop Nav -->
      <ul class="nav-menu">
        <li><a href="index.html" class="nav-link ${isPageActive('index.html') || isPageActive('/') ? 'active' : ''}">Home</a></li>
        <li><a href="about.html" class="nav-link ${isPageActive('about.html') ? 'active' : ''}">About Us</a></li>
        <li><a href="shop.html" class="nav-link ${isPageActive('shop.html') && !window.location.search.includes('category=accessories') ? 'active' : ''}">Products</a></li>
        <li><a href="shop.html?category=accessories" class="nav-link ${window.location.search.includes('category=accessories') ? 'active' : ''}">Accessories</a></li>
        <li><a href="contact.html" class="nav-link ${isPageActive('contact.html') ? 'active' : ''}">Contact Us</a></li>
      </ul>

      <!-- Actions -->
      <div class="header-actions">
        <!-- Search bar desktop -->
        <div class="search-bar-container">
          <button class="search-icon-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
          <input type="text" placeholder="Search accessories..." class="search-input" id="desktop-search-input">
          <div class="search-suggestions" id="desktop-suggestions"></div>
        </div>

        <!-- Cart Button -->
        <a href="cart.html" class="cart-icon-btn">
          <i class="fa-solid fa-cart-shopping"></i>
          <span class="cart-badge" style="display: none;">0</span>
        </a>

        <!-- Hamburger Icon Mobile -->
        <button class="hamburger-btn" id="mobile-hamburger-trigger">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </div>
  `;

  // Render Mobile Drawer Menu
  let backdrop = document.querySelector('.drawer-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    document.body.appendChild(backdrop);
  }

  let mobileDrawer = document.querySelector('.mobile-drawer');
  if (!mobileDrawer) {
    mobileDrawer = document.createElement('div');
    mobileDrawer.className = 'mobile-drawer';
    document.body.appendChild(mobileDrawer);
  }

  mobileDrawer.innerHTML = `
    <div class="mobile-drawer-header">
      <span class="logo-text">${settings.shopName.split(' ')[0]} <span>${settings.shopName.split(' ').slice(1).join(' ') || ''}</span></span>
      <button class="mobile-drawer-close" id="mobile-drawer-close-btn"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <!-- Mobile Search -->
    <div class="mobile-search-box" style="margin: 15px 0;">
      <div class="search-bar-container mobile-visible">
        <button class="search-icon-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
        <input type="text" placeholder="Search accessories..." class="search-input" id="mobile-search-input">
        <div class="search-suggestions" id="mobile-suggestions"></div>
      </div>
    </div>
    <ul class="mobile-nav-menu">
      <li><a href="index.html" class="mobile-nav-link ${isPageActive('index.html') || isPageActive('/') ? 'active' : ''}">Home</a></li>
      <li><a href="about.html" class="mobile-nav-link ${isPageActive('about.html') ? 'active' : ''}">About Us</a></li>
      <li><a href="shop.html" class="mobile-nav-link ${isPageActive('shop.html') && !window.location.search.includes('category=accessories') ? 'active' : ''}">Products</a></li>
      <li><a href="shop.html?category=accessories" class="mobile-nav-link ${window.location.search.includes('category=accessories') ? 'active' : ''}">Accessories</a></li>
      <li><a href="contact.html" class="mobile-nav-link ${isPageActive('contact.html') ? 'active' : ''}">Contact Us</a></li>
    </ul>
  `;

  // Bind Drawer Toggle events
  const hamBtn = document.getElementById('mobile-hamburger-trigger');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');

  const openDrawer = () => {
    mobileDrawer.classList.add('open');
    backdrop.classList.add('show');
  };

  const closeDrawer = () => {
    mobileDrawer.classList.remove('open');
    backdrop.classList.remove('show');
  };

  if (hamBtn) hamBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
}

// Render Footer HTML
function renderFooter(settings) {
  const footerEl = document.querySelector('footer');
  if (!footerEl) return;

  let cleanNum = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  if (cleanNum.length === 10) {
    cleanNum = '91' + cleanNum;
  }
  if (!cleanNum) {
    cleanNum = '917654085663';
  }

  const currentYear = new Date().getFullYear();

  // Social handles validation - hide if empty
  const instagramHtml = settings.socialInstagram ? `<a href="${settings.socialInstagram}" class="social-icon" target="_blank"><i class="fa-brands fa-instagram"></i></a>` : '';
  const facebookHtml = settings.socialFacebook ? `<a href="${settings.socialFacebook}" class="social-icon" target="_blank"><i class="fa-brands fa-facebook"></i></a>` : '';
  const youtubeHtml = settings.socialYoutube ? `<a href="${settings.socialYoutube}" class="social-icon" target="_blank"><i class="fa-brands fa-youtube"></i></a>` : '';
  const telegramHtml = settings.socialTelegram ? `<a href="${settings.socialTelegram}" class="social-icon" target="_blank"><i class="fa-brands fa-telegram"></i></a>` : '';

  footerEl.innerHTML = `
    <div class="container section-padding" style="padding-bottom: 20px;">
      <div class="footer-top">
        <!-- Col 1 -->
        <div class="footer-column">
          <div class="footer-logo">
            ${settings.shopName.split(' ')[0]} <span>${settings.shopName.split(' ').slice(1).join(' ') || ''}</span>
          </div>
          <p style="margin-bottom: 15px;">${settings.tagline}</p>
          <p>Explore our premium selection of mobile phone covers, 11D tempered glasses, power banks, fast chargers, and Bluetooth adapters at unmatched quality and rates.</p>
          <div class="footer-social-links">
            ${instagramHtml}
            ${facebookHtml}
            ${youtubeHtml}
            ${telegramHtml}
          </div>
        </div>
        <!-- Col 2 -->
        <div class="footer-column">
          <h3>Quick Links</h3>
          <ul class="footer-links">
            <li><a href="index.html"><i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 5px;"></i> Home</a></li>
            <li><a href="shop.html"><i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 5px;"></i> Shop Products</a></li>
            <li><a href="about.html"><i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 5px;"></i> About Us</a></li>
            <li><a href="contact.html"><i class="fa-solid fa-angle-right" style="font-size: 0.7rem; margin-right: 5px;"></i> Contact Us</a></li>
          </ul>
        </div>
        <!-- Col 3 -->
        <div class="footer-column">
          <h3>Customer Support</h3>
          <ul class="footer-links">
            <li><a href="contact.html">Help & Contact</a></li>
            <li><a href="https://wa.me/${cleanNum}" target="_blank">WhatsApp Chat Support</a></li>
            <li><a href="about.html#shipping">Shipping & Delivery Info</a></li>
            <li><a href="about.html#returns">Easy Returns Policy</a></li>
            <li><a href="about.html#privacy">Privacy & Terms</a></li>
          </ul>
        </div>
        <!-- Col 4 -->
        <div class="footer-column">
          <h3>Store Contact</h3>
          <div class="footer-contact-info">
            <div class="footer-contact-item">
              <i class="fa-solid fa-location-dot"></i>
              <span>${settings.address}</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-phone"></i>
              <span>${settings.phone}</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-envelope"></i>
              <span>${settings.email}</span>
            </div>
            <div class="footer-contact-item">
              <i class="fa-solid fa-clock"></i>
              <span>${settings.openingHours}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>© ${currentYear} <strong>${settings.shopName}</strong>. All Rights Reserved.</p>
        <p style="font-size: 0.75rem; color: var(--text-muted);">Made with care for ${settings.shopName}</p>
      </div>
    </div>
  `;
}

// WhatsApp Float CTA
function renderWhatsAppFloat(settings) {
  if (!settings.whatsapp) return;
  
  let widget = document.querySelector('.whatsapp-float-widget');
  if (!widget) {
    widget = document.createElement('a');
    widget.className = 'whatsapp-float-widget';
    widget.target = '_blank';
    document.body.appendChild(widget);
  }

  let cleanNumber = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }
  if (!cleanNumber) {
    cleanNumber = '917654085663';
  }
  widget.href = `https://wa.me/${cleanNumber}?text=Hi%20${encodeURIComponent(settings.shopName)},%20I%20have%20a%20query%20regarding%20mobile%20accessories.`;
  widget.innerHTML = `<i class="fa-brands fa-whatsapp"></i>`;
}

// Live Search Suggestions logic
function initSearchEvent() {
  const desktopSearch = document.getElementById('desktop-search-input');
  const desktopSuggestions = document.getElementById('desktop-suggestions');
  const mobileSearch = document.getElementById('mobile-search-input');
  const mobileSuggestions = document.getElementById('mobile-suggestions');

  const setupSearch = (input, suggestionsBox) => {
    if (!input || !suggestionsBox) return;

    input.addEventListener('input', async (e) => {
      const value = e.target.value.trim();
      if (value.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
      }

      try {
        const products = await window.api.products.getAll({ search: value });
        suggestionsBox.innerHTML = '';
        
        if (products.length === 0) {
          suggestionsBox.innerHTML = `<div style="padding: 12px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">No products found</div>`;
          suggestionsBox.style.display = 'block';
          return;
        }

        // Limit to 5 suggestions
        products.slice(0, 5).forEach(product => {
          const item = document.createElement('div');
          item.className = 'suggestion-item';
          item.innerHTML = `
            <img src="${product.images[0] ? (product.images[0].url || product.images[0]) : ''}" alt="${product.name}" class="suggestion-img">
            <div class="suggestion-name">${product.name}</div>
            <div class="suggestion-price">₹${product.discountPrice || product.price}</div>
          `;
          item.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
          });
          suggestionsBox.appendChild(item);
        });

        suggestionsBox.style.display = 'block';
      } catch (err) {
        console.error(err);
      }
    });

    // Close suggestions box on outside click
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
      }
    });

    // Trigger full search on enter press
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          window.location.href = `shop.html?search=${encodeURIComponent(val)}`;
        }
      }
    });
  };

  setupSearch(desktopSearch, desktopSuggestions);
  setupSearch(mobileSearch, mobileSuggestions);
}

// Export cart utilities
window.cart = cart;

// Dynamic Page Loader & Back To Top Arrow Setup
(function() {
  const isAdmin = window.location.pathname.includes('/admin/');
  if (isAdmin) return;

  // 1. Create and Inject Page Loader Overlay
  const injectLoader = () => {
    if (document.getElementById('page-loader-screen')) return;
    const loader = document.createElement('div');
    loader.id = 'page-loader-screen';
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-logo">INTERNATIONAL <span>MOBILE</span></div>
        <div class="loader-bar-container">
          <div class="loader-progress-bar"></div>
        </div>
        <div class="loader-spinner"></div>
      </div>
    `;
    document.body.prepend(loader);

    // Animate Progress Bar
    let progress = 0;
    const progressBar = loader.querySelector('.loader-progress-bar');
    const interval = setInterval(() => {
      if (progress < 85) {
        progress += Math.floor(Math.random() * 12) + 4;
        if (progress > 85) progress = 85;
        if (progressBar) progressBar.style.width = progress + '%';
      }
    }, 70);

    const fadeOutLoader = () => {
      clearInterval(interval);
      if (progressBar) progressBar.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.remove();
        }, 500);
      }, 150);
    };

    // Fade out loader on window loaded
    if (document.readyState === 'complete') {
      fadeOutLoader();
    } else {
      window.addEventListener('load', fadeOutLoader);
    }
  };

  // 2. Create and Inject Scroll-To-Top Button
  const injectBackToTop = () => {
    if (document.getElementById('back-to-top-trigger')) return;
    const btn = document.createElement('button');
    btn.id = 'back-to-top-trigger';
    btn.className = 'back-to-top-btn';
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(btn);

    // Show button when scrolled down
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    });

    // Scroll smoothly on click
    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  };

  // 3. Create and Inject Automated Device Detector
  const injectDeviceDetector = () => {
    // A. Check if user has already dismissed it within the last 3 days
    const DISMISS_KEY = 'tz_device_detector_dismissed_time';
    const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed && (Date.now() - parseInt(lastDismissed, 10) < COOLDOWN_MS)) {
      return;
    }

    // B. Detect User Device (Brand & Model)
    const ua = navigator.userAgent;
    let brand = "";
    let model = "";
    let friendlyName = "";
    let isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

    // Only run if it's a mobile device (or emulated mobile)
    if (!isMobile) return;

    if (/iPhone/i.test(ua)) {
      brand = "Apple";
      model = "iPhone";
      friendlyName = "iPhone";
    } else if (/iPad/i.test(ua)) {
      brand = "Apple";
      model = "iPad";
      friendlyName = "iPad";
    } else if (/Android/i.test(ua)) {
      // Android model extraction from UA
      const match = ua.match(/Android\s+[^;]+;\s+([^;)]+)/);
      if (match && match[1]) {
        model = match[1].trim();
        // Remove build strings
        model = model.split(" Build/")[0].split(" build/")[0].trim();

        // Detect brand
        if (/Samsung/i.test(ua) || /^SM-/i.test(model) || /^GT-/i.test(model)) {
          brand = "Samsung";
        } else if (/OnePlus/i.test(ua) || /^OP/i.test(model) || /^CPH/i.test(model)) {
          brand = "OnePlus";
        } else if (/Pixel/i.test(ua)) {
          brand = "Google";
        } else if (/Redmi|Mi|Xiaomi/i.test(ua)) {
          brand = "Xiaomi";
        } else if (/Oppo/i.test(ua)) {
          brand = "Oppo";
        } else if (/Vivo/i.test(ua)) {
          brand = "Vivo";
        } else if (/Realme/i.test(ua)) {
          brand = "Realme";
        }

        // Map common Samsung, OnePlus and Pixel codes to friendly names
        const samsungModels = {
          'SM-S928B': 'Galaxy S24 Ultra',
          'SM-S928U': 'Galaxy S24 Ultra',
          'SM-S921B': 'Galaxy S24',
          'SM-S926B': 'Galaxy S24+',
          'SM-S918B': 'Galaxy S23 Ultra',
          'SM-S918U': 'Galaxy S23 Ultra',
          'SM-S911B': 'Galaxy S23',
          'SM-S916B': 'Galaxy S23+',
          'SM-S908B': 'Galaxy S22 Ultra',
          'SM-S901B': 'Galaxy S22',
          'SM-S906B': 'Galaxy S22+',
          'SM-G998B': 'Galaxy S21 Ultra',
          'SM-G991B': 'Galaxy S21',
          'SM-A546B': 'Galaxy A54 5G',
          'SM-A346B': 'Galaxy A34 5G',
          'SM-M536B': 'Galaxy M53 5G',
          'SM-G781B': 'Galaxy S20 FE',
        };

        const oneplusModels = {
          'CPH2581': 'OnePlus 12',
          'CPH2449': 'OnePlus 11',
          'NE2213': 'OnePlus 10 Pro',
          'DN2103': 'OnePlus Nord 2',
        };

        const pixelModels = {
          'Pixel 8 Pro': 'Pixel 8 Pro',
          'Pixel 8': 'Pixel 8',
          'Pixel 7 Pro': 'Pixel 7 Pro',
          'Pixel 7': 'Pixel 7',
          'Pixel 6a': 'Pixel 6a',
        };

        let checkModel = model;
        if (samsungModels[checkModel]) {
          friendlyName = samsungModels[checkModel];
        } else if (oneplusModels[checkModel]) {
          friendlyName = oneplusModels[checkModel];
        } else if (pixelModels[checkModel]) {
          friendlyName = pixelModels[checkModel];
        } else {
          // General cleanup (if model starts with brand, don't repeat it)
          if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) {
            friendlyName = model;
          } else {
            friendlyName = brand ? `${brand} ${model}` : model;
          }
        }
      } else {
        // Fallback Android device name
        friendlyName = "Android Device";
      }
    }

    if (!friendlyName) {
      friendlyName = "Mobile Device";
    }

    // C. Create Popup Element
    const toast = document.createElement('div');
    toast.className = 'device-detector-toast';
    toast.id = 'device-detector-toast';
    toast.innerHTML = `
      <div class="device-detector-header">
        <div class="device-detector-title-group">
          <div class="device-detector-icon">
            <i class="fa-solid fa-mobile-screen-button"></i>
          </div>
          <div class="device-detector-title">Shopping for <strong>${friendlyName}</strong>?</div>
        </div>
        <button class="device-detector-close" id="device-detector-close" aria-label="Dismiss">&times;</button>
      </div>
      <div class="device-detector-body">
        Get the perfect cases, screen protectors, and accessories compatible with your <strong>${friendlyName}</strong>.
      </div>
      <div class="device-detector-actions">
        <button class="device-detector-btn-primary" id="device-detector-btn-yes">View Compatible Cases</button>
        <button class="device-detector-btn-secondary" id="device-detector-btn-no">No, Thanks</button>
      </div>
    `;

    document.body.appendChild(toast);

    // D. Function to close the toast & set cooldown
    const dismissToast = () => {
      toast.classList.remove('show');
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
      setTimeout(() => toast.remove(), 500);
    };

    // E. Bind button events
    const closeBtn = toast.querySelector('#device-detector-close');
    const noBtn = toast.querySelector('#device-detector-btn-no');
    const yesBtn = toast.querySelector('#device-detector-btn-yes');

    closeBtn.addEventListener('click', dismissToast);
    noBtn.addEventListener('click', dismissToast);
    yesBtn.addEventListener('click', () => {
      // Redirect to shop page with search query
      let searchQuery = friendlyName;
      // Optimize search query slightly: remove brand prefix for more general search matches
      if (brand && searchQuery.startsWith(brand + " ")) {
        searchQuery = searchQuery.replace(brand + " ", "");
      }
      
      window.location.href = `shop.html?search=${encodeURIComponent(searchQuery)}`;
    });

    // F. Show toast with a 2 second delay for premium entry animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 2000);
  };

  // Run immediately if DOM is loaded, otherwise register listener
  if (document.body) {
    injectLoader();
    injectBackToTop();
    injectDeviceDetector();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      injectLoader();
      injectBackToTop();
      injectDeviceDetector();
    });
  }
})();
