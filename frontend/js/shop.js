// TechZone Mobile Accessories - Shop Page Controller

// Active filter state
let activeFilters = {
  category: '',
  brand: '',
  search: '',
  minPrice: '',
  maxPrice: '',
  inStock: 'false',
  sort: 'newest'
};

// Infinite Scroll state variables
let allProducts = [];
let renderedCount = 0;
const BATCH_SIZE = 8;
let isFetching = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Parse query parameters from URL
  parseQueryParams();

  // Load Filter options in sidebar
  await loadFilterOptions();

  // Bind event listeners
  setupFilterEvents();

  // First fetch and render
  fetchAndRenderProducts();
});

// Parse initial URL queries
function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('category')) activeFilters.category = params.get('category');
  if (params.has('brand')) activeFilters.brand = params.get('brand');
  if (params.has('search')) {
    activeFilters.search = params.get('search');
    // Pre-fill header search value as well
    const deskInput = document.getElementById('desktop-search-input');
    if (deskInput) deskInput.value = params.get('search');
    const sideInput = document.getElementById('sidebar-search');
    if (sideInput) sideInput.value = params.get('search');
  }
  if (params.has('minPrice')) activeFilters.minPrice = params.get('minPrice');
  if (params.has('maxPrice')) activeFilters.maxPrice = params.get('maxPrice');
  if (params.has('featured')) activeFilters.featured = params.get('featured');
  if (params.has('newArrival')) activeFilters.newArrival = params.get('newArrival');
  if (params.has('sort')) activeFilters.sort = params.get('sort');
}

// Fetch categories & unique brands to populate checklists
async function loadFilterOptions() {
  const catList = document.getElementById('filter-categories-list');
  const brandList = document.getElementById('filter-brands-list');
  
  try {
    // 1. Categories
    const categories = await window.api.categories.getAll();
    if (catList) {
      catList.innerHTML = categories.map(cat => {
        const isChecked = activeFilters.category === cat.slug ? 'checked' : '';
        return `
          <li class="filter-item">
            <label for="cat-${cat.id}">
              <input type="checkbox" class="category-filter-checkbox" id="cat-${cat.id}" data-slug="${cat.slug}" ${isChecked}>
              ${cat.name}
            </label>
          </li>
        `;
      }).join('');
    }

    // 2. Unique Brands from all active products (sanitize empty/whitespace brands to prevent unnamed checkbox)
    const products = await window.api.products.getAll();
    const brands = [...new Set(products.map(p => p.brand ? p.brand.trim() : '').filter(b => b !== ''))].sort();
    if (brandList) {
      brandList.innerHTML = brands.map((brand, idx) => {
        const isChecked = (activeFilters.brand && activeFilters.brand.toLowerCase() === brand.toLowerCase()) ? 'checked' : '';
        return `
          <li class="filter-item">
            <label for="brand-${idx}">
              <input type="checkbox" class="brand-filter-checkbox" id="brand-${idx}" data-brand="${brand}" ${isChecked}>
              ${brand}
            </label>
          </li>
        `;
      }).join('');
    }

    // Pre-fill input boxes from URL query values
    const minInput = document.getElementById('filter-price-min');
    const maxInput = document.getElementById('filter-price-max');
    if (minInput && activeFilters.minPrice) minInput.value = activeFilters.minPrice;
    if (maxInput && activeFilters.maxPrice) maxInput.value = activeFilters.maxPrice;

    const sortSelect = document.getElementById('shop-sort-select');
    if (sortSelect && activeFilters.sort) sortSelect.value = activeFilters.sort;

  } catch (err) {
    console.error("Failed to load filter items", err);
  }
}

// Bind Filter input events
function setupFilterEvents() {
  // Mobile drawer trigger
  const openFilter = document.getElementById('mobile-filter-open');
  const closeFilter = document.getElementById('mobile-filter-close');
  const sidebar = document.getElementById('filter-sidebar');

  if (openFilter && sidebar) {
    openFilter.addEventListener('click', () => {
      sidebar.classList.add('open-mobile');
    });
  }
  if (closeFilter && sidebar) {
    closeFilter.addEventListener('click', () => {
      sidebar.classList.remove('open-mobile');
    });
  }

  // Sidebar Search
  const sideSearch = document.getElementById('sidebar-search');
  if (sideSearch) {
    sideSearch.addEventListener('input', (e) => {
      activeFilters.search = e.target.value.trim();
      fetchAndRenderProducts();
    });
  }

  // Category Checkboxes
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('category-filter-checkbox')) {
      const checkedBoxes = document.querySelectorAll('.category-filter-checkbox:checked');
      if (checkedBoxes.length > 0) {
        // Simple filter model: support filtering by first selected checkbox slug
        // (Or join them if backed by API, our mock handles single query param)
        activeFilters.category = checkedBoxes[0].dataset.slug;
        
        // Uncheck others to simulate single selection (unless multi-select is coded, 
        // our mockAPI processes single category slug filter.category)
        checkedBoxes.forEach(box => {
          if (box !== e.target) box.checked = false;
        });
      } else {
        activeFilters.category = '';
      }
      fetchAndRenderProducts();
    }
  });

  // Brand Checkboxes
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('brand-filter-checkbox')) {
      const checkedBoxes = document.querySelectorAll('.brand-filter-checkbox:checked');
      if (checkedBoxes.length > 0) {
        activeFilters.brand = checkedBoxes[0].dataset.brand;
        checkedBoxes.forEach(box => {
          if (box !== e.target) box.checked = false;
        });
      } else {
        activeFilters.brand = '';
      }
      fetchAndRenderProducts();
    }
  });

  // Price Filter Apply
  const applyPriceBtn = document.getElementById('btn-apply-price-filter');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      const minInput = document.getElementById('filter-price-min');
      const maxInput = document.getElementById('filter-price-max');
      activeFilters.minPrice = minInput ? minInput.value : '';
      activeFilters.maxPrice = maxInput ? maxInput.value : '';
      fetchAndRenderProducts();
    });
  }

  // Availability / Stock Checkbox
  const stockCheck = document.getElementById('filter-stock-instock');
  if (stockCheck) {
    stockCheck.addEventListener('change', (e) => {
      activeFilters.inStock = e.target.checked ? 'true' : 'false';
      fetchAndRenderProducts();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      fetchAndRenderProducts();
    });
  }

  // Clear All
  const clearBtn = document.getElementById('btn-clear-all-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Clear values
      activeFilters = {
        category: '',
        brand: '',
        search: '',
        minPrice: '',
        maxPrice: '',
        inStock: 'false',
        sort: 'newest',
        featured: '',
        newArrival: '',
        bestseller: ''
      };

      // Reset controls
      const inputs = document.querySelectorAll('.category-filter-checkbox, .brand-filter-checkbox');
      inputs.forEach(i => i.checked = false);

      const stockBox = document.getElementById('filter-stock-instock');
      if (stockBox) stockBox.checked = false;

      const minIn = document.getElementById('filter-price-min');
      const maxIn = document.getElementById('filter-price-max');
      if (minIn) minIn.value = '';
      if (maxIn) maxIn.value = '';

      const searchIn = document.getElementById('sidebar-search');
      if (searchIn) searchIn.value = '';

      const headerSearch = document.getElementById('desktop-search-input');
      if (headerSearch) headerSearch.value = '';

      const sortBox = document.getElementById('shop-sort-select');
      if (sortBox) sortBox.value = 'newest';

      fetchAndRenderProducts();
    });
  }

  // Make sidebar widgets collapsible (accordion style)
  const widgets = document.querySelectorAll('.shop-sidebar-widget');
  widgets.forEach(widget => {
    const header = widget.querySelector('h3');
    const list = widget.querySelector('.filter-list') || widget.querySelector('.price-range-inputs') || widget.querySelector('#btn-clear-all-filters');
    if (header && list) {
      header.style.cursor = 'pointer';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.userSelect = 'none';

      // Insert chevron arrow icon if not already present
      if (!header.querySelector('i')) {
        header.innerHTML += ' <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; transition: transform 0.25s ease;"></i>';
      }
      
      const icon = header.querySelector('i');

      header.addEventListener('click', () => {
        const isCollapsed = widget.classList.toggle('collapsed');
        
        // Toggle slide visual display
        if (isCollapsed) {
          list.style.display = 'none';
          if (widget.querySelector('.btn-block')) {
            const btn = widget.querySelector('.btn-block');
            if (btn && btn.id === 'btn-apply-price-filter') btn.style.display = 'none';
          }
          if (icon) icon.style.transform = 'rotate(-90deg)';
        } else {
          list.style.display = 'block';
          if (widget.querySelector('.btn-block')) {
            const btn = widget.querySelector('.btn-block');
            if (btn && btn.id === 'btn-apply-price-filter') btn.style.display = 'block';
          }
          if (icon) icon.style.transform = 'rotate(0deg)';
        }
      });
    }
  });
}

// Fetch and render filtered grid
async function fetchAndRenderProducts() {
  const grid = document.getElementById('shop-products-grid');
  const countLabel = document.getElementById('shop-results-count-label');
  const loader = document.getElementById('infinite-scroll-loader');
  if (!grid) return;

  grid.innerHTML = Array(6).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');
  if (loader) loader.style.display = 'none';

  try {
    const products = await window.api.products.getAll(activeFilters);
    grid.innerHTML = '';
    
    // Cache the loaded products list
    allProducts = products;
    renderedCount = 0;
    
    // Render first batch
    renderNextBatch();

  } catch (err) {
    console.error("Error drawing products list", err);
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Something went wrong while retrieving products.</div>`;
  }
}

// Render next batch of items in infinite scroll
function renderNextBatch() {
  const grid = document.getElementById('shop-products-grid');
  const loader = document.getElementById('infinite-scroll-loader');
  if (!grid) return;

  const countLabel = document.getElementById('shop-results-count-label');
  if (countLabel) {
    countLabel.textContent = `Showing ${Math.min(renderedCount + BATCH_SIZE, allProducts.length)} of ${allProducts.length} product${allProducts.length === 1 ? '' : 's'}`;
  }

  const nextBatch = allProducts.slice(renderedCount, renderedCount + BATCH_SIZE);
  
  if (nextBatch.length === 0 && renderedCount === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div>
        <h2>No Products Found</h2>
        <p>We couldn't find any products matching your filters. Try clearing your filters or widening search terms.</p>
      </div>
    `;
    if (loader) loader.style.display = 'none';
    return;
  }

  nextBatch.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const hasDiscount = prod.discountPrice && prod.discountPrice < prod.price;
    const discountPct = hasDiscount ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;
    
    let badgeHtml = '';
    if (prod.stock <= 0) {
      badgeHtml = `<span class="badge badge-outofstock">Out of Stock</span>`;
    } else {
      if (hasDiscount) {
        badgeHtml += `<span class="badge badge-offer">${discountPct}% OFF</span>`;
      }
      if (prod.newArrival || window.isRecentAddition(prod.createdAt)) {
        badgeHtml += `<span class="badge badge-new">New</span>`;
      }
      if (prod.bestseller) {
        badgeHtml += `<span class="badge badge-bestseller">Bestseller</span>`;
      }
    }

    const ratingVal = prod.rating || 4.5;
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(ratingVal)) {
        starsHtml += `<i class="fa-solid fa-star"></i>`;
      } else if (i - 0.5 <= ratingVal) {
        starsHtml += `<i class="fa-solid fa-star-half-stroke"></i>`;
      } else {
        starsHtml += `<i class="fa-regular fa-star"></i>`;
      }
    }

    const priceHtml = hasDiscount 
      ? `<span class="product-discount-price">₹${prod.discountPrice}</span>
         <span class="product-original-price">₹${prod.price}</span>`
      : `<span class="product-discount-price">₹${prod.price}</span>`;

    card.innerHTML = `
      <div class="product-image-container">
        <a href="product.html?id=${prod.id}">
          <img src="${window.getOptimizedImageUrl(prod.images[0], { width: 600 })}" alt="${prod.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'">
        </a>
        <div class="product-badges">${badgeHtml}</div>
        ${window.getBrandLogoHtml ? window.getBrandLogoHtml(prod.brand) : ''}
        <button class="product-quickview-btn btn-quick-view" data-id="${prod.id}" title="Quick View" aria-label="Quick View ${prod.name}"><i class="fa-regular fa-eye"></i></button>
        <button class="product-wishlist-btn" title="Add to Wishlist" aria-label="Add ${prod.name} to Wishlist"><i class="fa-regular fa-heart"></i></button>
      </div>
      <div class="product-info">
        <div class="product-brand">${prod.brand}</div>
        <a href="product.html?id=${prod.id}" class="product-title" title="${prod.name}">${prod.name}</a>
        <div class="product-rating">
          <span class="stars-rating">${starsHtml}</span>
          <span class="rating-count">(${prod.reviewsCount || 10})</span>
        </div>
        <div class="product-price-wrapper">
          ${priceHtml}
        </div>
        <div class="product-card-actions">
          <button class="add-cart-btn btn-add-to-cart" data-id="${prod.id}" ${prod.stock <= 0 ? 'disabled style="background-color: var(--text-muted); cursor: not-allowed; width: 100%; flex: 1;"' : ''}>
            ${prod.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button class="buy-now-btn btn-buy-now" data-id="${prod.id}" ${prod.stock <= 0 ? 'disabled style="display: none;"' : ''}>
            Buy Now
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-add-to-cart').addEventListener('click', () => {
      if (prod.stock <= 0) return;
      window.cart.add(prod, 1);
    });

    card.querySelector('.btn-buy-now').addEventListener('click', () => {
      if (prod.stock <= 0) return;
      const success = window.cart.add(prod, 1);
      if (success) {
        window.location.href = 'cart.html';
      }
    });

    // Bind Quick View
    card.querySelector('.btn-quick-view').addEventListener('click', async (e) => {
      e.stopPropagation();
      window.openQuickViewModal(prod.id);
    });

    grid.appendChild(card);
  });

  renderedCount += nextBatch.length;

  // Show/hide loading indicator
  if (loader) {
    if (renderedCount < allProducts.length) {
      loader.style.display = 'block';
    } else {
      loader.style.display = 'none';
    }
  }
}

// Scroll event listener for infinite scroll
window.addEventListener('scroll', () => {
  const loader = document.getElementById('infinite-scroll-loader');
  if (!loader || loader.style.display === 'none' || isFetching) return;

  // Check if we are near the bottom of the viewport
  const threshold = 150; // pixels from the bottom
  const position = window.innerHeight + window.scrollY;
  const height = document.documentElement.offsetHeight;

  if (position >= height - threshold) {
    isFetching = true;
    
    // Simulate loading delay for smooth visual display of the loading progress arrow icon
    setTimeout(() => {
      renderNextBatch();
      isFetching = false;
    }, 800);
  }
});
