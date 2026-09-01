// TechZone Mobile Accessories - Category Page Controller

let categorySlug = '';
let currentSort = 'newest';
let currentBrand = '';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  categorySlug = params.get('slug');

  if (!categorySlug) {
    window.location.href = 'shop.html';
    return;
  }

  // Load category details
  await loadCategoryData();

  // Load unique brand filter options
  await loadBrandDropdown();

  // Load and render products
  await loadCategoryProducts();

  // Bind sorting selector
  const sortSelect = document.getElementById('category-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadCategoryProducts();
    });
  }

  // Bind brand selector
  const brandSelect = document.getElementById('category-brand-select');
  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      currentBrand = e.target.value;
      loadCategoryProducts();
    });
  }
});

// Load category info from database
async function loadCategoryData() {
  try {
    const categories = await window.api.categories.getAll();
    const currentCat = categories.find(c => c.slug === categorySlug);
    
    if (currentCat) {
      document.getElementById('category-title').textContent = currentCat.name;
      document.getElementById('breadcrumb-category-name').textContent = currentCat.name;
      document.getElementById('category-desc').textContent = currentCat.description || '';
      document.title = `${currentCat.name} Accessories`;
    } else {
      // Fallback formatting if category doesn't exist in DB seed
      const formattedName = categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      document.getElementById('category-title').textContent = formattedName;
      document.getElementById('breadcrumb-category-name').textContent = formattedName;
      document.title = `${formattedName} Accessories`;
    }
  } catch (err) {
    console.error("Failed to load category title", err);
  }
}

// Load unique brands for products in this category
async function loadBrandDropdown() {
  const brandSelect = document.getElementById('category-brand-select');
  if (!brandSelect) return;

  try {
    // Fetch products in this category to get unique brands
    const products = await window.api.products.getAll({
      category: categorySlug
    });
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
    
    brandSelect.innerHTML = '<option value="">All Brands</option>' +
      brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
  } catch (err) {
    console.error("Failed to load brands dropdown", err);
  }
}

// Fetch and render filtered products
async function loadCategoryProducts() {
  const grid = document.getElementById('category-products-grid');
  const countLabel = document.getElementById('category-count-label');
  if (!grid) return;

  grid.innerHTML = Array(4).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');

  try {
    const products = await window.api.products.getAll({
      category: categorySlug,
      brand: currentBrand,
      sort: currentSort
    });

    grid.innerHTML = '';
    
    if (countLabel) {
      countLabel.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
          <h2>No Products Found</h2>
          <p>There are no products listed under this category yet. Check back later!</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top:15px;">Browse Other Accessories</a>
        </div>
      `;
      return;
    }

    // Render cards
    products.forEach(prod => {
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

      const displayUnitPrice = (prod.pricePerPiece && Number(prod.pricePerPiece) > 0)
        ? prod.pricePerPiece
        : (prod.discountPrice || prod.price);
      const unitBadge = (prod.pricePerPiece && Number(prod.pricePerPiece) > 0) ? ' / pc' : '';

      const priceHtml = hasDiscount 
        ? `<span class="product-discount-price">₹${displayUnitPrice}${unitBadge}</span>
           <span class="product-original-price">₹${prod.price}</span>`
        : `<span class="product-discount-price">₹${displayUnitPrice}${unitBadge}</span>`;

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
          <div class="product-stock-display" data-id="${prod.id}" style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;"></div>
          <div class="product-price-wrapper">
            ${priceHtml}
          </div>
          <div class="product-card-actions">
            <button class="add-cart-btn btn-add-to-cart" data-id="${prod.id}" data-stock="${prod.stock}" ${prod.stock <= 0 ? 'disabled style="background-color: var(--text-muted); cursor: not-allowed; width: 100%; flex: 1;"' : ''}>
              ${prod.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button class="buy-now-btn btn-buy-now" data-id="${prod.id}" data-stock="${prod.stock}" ${prod.stock <= 0 ? 'disabled style="display: none;"' : ''}>
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

    window.cart.updateDOMButtons();

  } catch (err) {
    console.error("Failed to load category products", err);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Error loading category products.</div>`;
  }
}
