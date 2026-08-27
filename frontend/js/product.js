// TechZone Mobile Accessories - Product Detail Controller

let currentProduct = null;
let currentQuantity = 1;
let selectedRating = 5;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }

  // Load details
  await loadProductDetails(productId);

  // Setup stars selection in review form
  setupStarsSelection();

  // Bind review submission
  const reviewForm = document.getElementById('review-submit-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }
});

// Load and render product details
async function loadProductDetails(id) {
  const loader = document.getElementById('product-detail-loader');
  const content = document.getElementById('product-detail-content');

  try {
    const product = await window.api.products.getById(id);
    currentProduct = product;

    // Fetch site settings for currency / whatsapp details
    const settings = await window.api.settings.get();

    // 1. Breadcrumbs
    const catBreadcrumb = document.getElementById('breadcrumb-category');
    const nameBreadcrumb = document.getElementById('breadcrumb-product-name');
    
    if (catBreadcrumb) {
      catBreadcrumb.textContent = formatSlugName(product.categorySlug);
      catBreadcrumb.href = `category.html?slug=${product.categorySlug}`;
    }
    if (nameBreadcrumb) nameBreadcrumb.textContent = product.name;

    // 2. Titles & Info
    document.getElementById('detail-brand').textContent = product.brand;
    document.getElementById('detail-title').textContent = product.name;
    document.getElementById('detail-sku').textContent = `SKU: ${product.sku}`;
    document.getElementById('detail-description-text').textContent = product.description;

    // 3. Pricing
    const priceEl = document.getElementById('detail-price');
    const origPriceEl = document.getElementById('detail-original-price');
    const savingEl = document.getElementById('detail-saving-pct');

    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    priceEl.textContent = `₹${hasDiscount ? product.discountPrice : product.price}`;

    if (hasDiscount) {
      origPriceEl.textContent = `₹${product.price}`;
      origPriceEl.style.display = 'inline';
      const savingPct = Math.round(((product.price - product.discountPrice) / product.price) * 100);
      savingEl.textContent = `${savingPct}% OFF`;
      savingEl.style.display = 'inline-block';
    } else {
      origPriceEl.style.display = 'none';
      savingEl.style.display = 'none';
    }

    // 4. Stock status
    const stockStatusEl = document.getElementById('detail-stock-status');
    const addCartBtn = document.getElementById('btn-detail-add-cart');
    const buyNowBtn = document.getElementById('btn-detail-buy-now');

    if (product.stock <= 0) {
      stockStatusEl.innerHTML = `<span class="stock-status stock-outofstock"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
      addCartBtn.disabled = true;
      buyNowBtn.disabled = true;
      addCartBtn.textContent = 'Out of Stock';
    } else if (product.stock < 10) {
      stockStatusEl.innerHTML = `<span class="stock-status stock-low"><i class="fa-solid fa-circle-exclamation"></i> Low Stock! Only ${product.stock} left</span>`;
      addCartBtn.disabled = false;
      buyNowBtn.disabled = false;
    } else {
      stockStatusEl.innerHTML = `<span class="stock-status stock-instock"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;
      addCartBtn.disabled = false;
      buyNowBtn.disabled = false;
    }

    // 5. Image gallery
    const mainImg = document.getElementById('gallery-main-image');
    mainImg.src = product.images[0] ? (product.images[0].url || product.images[0]) : '';
    mainImg.alt = product.name;

    const thumbRow = document.getElementById('gallery-thumbnails-row');
    if (thumbRow) {
      thumbRow.innerHTML = product.images.map((imgObj, idx) => {
        const imgUrl = imgObj && imgObj.url ? imgObj.url : imgObj;
        const activeClass = idx === 0 ? 'active' : '';
        return `
          <div class="gallery-thumb-item ${activeClass}" data-image-url="${imgUrl}">
            <img src="${imgUrl}" alt="${product.name}">
          </div>
        `;
      }).join('');

      // Click event for thumbs
      const thumbs = thumbRow.querySelectorAll('.gallery-thumb-item');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
          thumbs.forEach(t => t.classList.remove('active'));
          const targetThumb = e.currentTarget;
          targetThumb.classList.add('active');
          mainImg.src = targetThumb.dataset.imageUrl;
        });
      });
    }

    // 6. Quantity Selector Bindings
    setupQuantitySelector();

    // 7. Action Button bindings
    addCartBtn.onclick = () => {
      window.cart.add(product, currentQuantity);
    };

    buyNowBtn.onclick = () => {
      const success = window.cart.add(product, currentQuantity);
      if (success) {
        window.location.href = 'cart.html';
      }
    };

    // WhatsApp Order Button
    updateWhatsAppOrderButton(settings);

    // 8. Specifications Table
    const specsTbody = document.getElementById('detail-specs-tbody');
    const specsSection = document.getElementById('product-specs-section');
    if (specsTbody && product.specifications && product.specifications.length > 0) {
      specsSection.style.display = 'block';
      specsTbody.innerHTML = product.specifications.map(spec => `
        <tr>
          <th>${spec.name}</th>
          <td>${spec.value}</td>
        </tr>
      `).join('');
    } else {
      if (specsSection) specsSection.style.display = 'none';
    }

    // 9. Load Reviews
    await loadReviews();

    // 10. Load Related Products
    await loadRelatedProducts(product.categorySlug, product.id);

    // Hide loader, show page
    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'grid';

  } catch (err) {
    console.error(err);
    if (loader) {
      loader.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fa-solid fa-circle-info"></i></div>
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed by the administrator.</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top: 15px;">Back to Shop</a>
        </div>
      `;
    }
  }
}

// Qty selectors
function setupQuantitySelector() {
  const btnMinus = document.getElementById('qty-minus');
  const btnPlus = document.getElementById('qty-plus');
  const qtyInput = document.getElementById('qty-val');

  if (!btnMinus || !btnPlus || !qtyInput) return;

  btnMinus.onclick = () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      qtyInput.value = currentQuantity;
      triggerQuantityUpdate();
    }
  };

  btnPlus.onclick = () => {
    if (currentQuantity < currentProduct.stock) {
      currentQuantity++;
      qtyInput.value = currentQuantity;
      triggerQuantityUpdate();
    } else {
      window.showToast("Cannot select more than available stock limit.", "error");
    }
  };
}

async function triggerQuantityUpdate() {
  const settings = await window.api.settings.get();
  updateWhatsAppOrderButton(settings);
}

// Generate Custom WhatsApp Order Text Link
function updateWhatsAppOrderButton(settings) {
  const btn = document.getElementById('btn-detail-whatsapp-order');
  if (!btn || !settings.whatsapp || !currentProduct) return;

  const cleanNum = settings.whatsapp.replace(/[^0-9]/g, '');
  const itemPrice = currentProduct.discountPrice || currentProduct.price;
  const totalCost = itemPrice * currentQuantity;

  // Formatted WhatsApp Message
  const textMsg = `Hello *${settings.shopName}*,

I would like to order this item:
*Product:* ${currentProduct.name}
*SKU:* ${currentProduct.sku}
*Quantity:* ${currentQuantity}
*Price per unit:* ₹${itemPrice}
*Total Amount:* ₹${totalCost}

Please confirm availability and share details for Cash on Delivery.`;

  btn.href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;
}

// Stars Input highlights
function setupStarsSelection() {
  const starsContainer = document.getElementById('review-stars-input-container');
  if (!starsContainer) return;

  const starBtns = starsContainer.querySelectorAll('.review-star-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rating = parseInt(e.currentTarget.dataset.rating);
      selectedRating = rating;

      starBtns.forEach(b => {
        const starVal = parseInt(b.dataset.rating);
        if (starVal <= rating) {
          b.classList.add('active');
          b.querySelector('i').className = 'fa-solid fa-star';
        } else {
          b.classList.remove('active');
          b.querySelector('i').className = 'fa-regular fa-star';
        }
      });
    });
  });
}

// Fetch and render reviews list
async function loadReviews() {
  const listEl = document.getElementById('product-reviews-list');
  const countEl = document.getElementById('detail-reviews-count');
  const starsHeader = document.getElementById('detail-stars');
  
  if (!listEl) return;

  try {
    const reviews = await window.api.reviews.getAll();
    
    // For mock demonstration, we filter reviews or show general reviews 
    // We will show reviews for this specific product, or fall back to general seeded comments
    listEl.innerHTML = '';
    
    if (countEl) {
      countEl.textContent = `(${reviews.length} Customer Review${reviews.length === 1 ? '' : 's'})`;
    }

    // Set overall rating stars in header
    const avgRating = 4.5;
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      starsHtml += i <= avgRating ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
    }
    if (starsHeader) starsHeader.innerHTML = starsHtml;

    reviews.forEach(rev => {
      let rStars = '';
      for (let i = 1; i <= 5; i++) {
        rStars += i <= rev.rating ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
      }

      const revCard = document.createElement('div');
      revCard.className = 'review-card';
      revCard.style.padding = '15px';
      revCard.innerHTML = `
        <div class="review-header" style="margin-bottom: 8px;">
          <strong class="reviewer-name">${rev.name}</strong>
          <span class="stars-rating" style="font-size: 0.8rem;">${rStars}</span>
        </div>
        <p class="review-comment" style="font-size: 0.85rem;">"${rev.comment}"</p>
        <div class="review-date" style="font-size: 0.7rem; margin-top: 5px;">${rev.date}</div>
      `;
      listEl.appendChild(revCard);
    });

  } catch (err) {
    console.error(err);
  }
}

// Submit custom review
async function handleReviewSubmit(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('rev-username');
  const commentInput = document.getElementById('rev-comment');

  if (!nameInput || !commentInput) return;

  try {
    await window.api.reviews.add({
      name: nameInput.value.trim(),
      rating: selectedRating,
      comment: commentInput.value.trim()
    });

    window.showToast("Review submitted successfully!", "success");

    // Reset Form
    nameInput.value = '';
    commentInput.value = '';
    
    // Reload Reviews
    await loadReviews();
  } catch (err) {
    console.error(err);
    window.showToast("Failed to post review.", "error");
  }
}

// Load categories matching slugs
async function loadRelatedProducts(slug, currentId) {
  const grid = document.getElementById('detail-related-grid');
  if (!grid) return;

  grid.innerHTML = Array(2).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');

  try {
    const products = await window.api.products.getAll({ category: slug });
    grid.innerHTML = '';
    
    // Filter current product
    const related = products.filter(p => p.id !== currentId).slice(0, 4);

    if (related.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1; color:var(--text-muted);">No related accessories found.</p>`;
      return;
    }

    related.forEach(prod => {
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
        if (prod.newArrival) {
          badgeHtml += `<span class="badge badge-new">New</span>`;
        }
        if (prod.bestseller) {
          badgeHtml += `<span class="badge badge-bestseller">Bestseller</span>`;
        }
      }

      const priceHtml = hasDiscount 
        ? `<span class="product-discount-price">₹${prod.discountPrice}</span>
           <span class="product-original-price">₹${prod.price}</span>`
        : `<span class="product-discount-price">₹${prod.price}</span>`;

      card.innerHTML = `
        <div class="product-image-container">
          <a href="product.html?id=${prod.id}">
            <img src="${prod.images[0] ? (prod.images[0].url || prod.images[0]) : ''}" alt="${prod.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'">
          </a>
          <div class="product-badges">${badgeHtml}</div>
          <button class="product-wishlist-btn" title="Add to Wishlist"><i class="fa-regular fa-heart"></i></button>
        </div>
        <div class="product-info">
          <div class="product-brand">${prod.brand}</div>
          <a href="product.html?id=${prod.id}" class="product-title" title="${prod.name}">${prod.name}</a>
          <div class="product-price-wrapper" style="margin-bottom: 12px;">
            ${priceHtml}
          </div>
          <div class="product-card-actions">
            <button class="add-cart-btn btn-add-to-cart" style="padding: 8px 4px; font-size:0.75rem; ${prod.stock <= 0 ? 'background-color: var(--text-muted); cursor: not-allowed; width: 100%; flex: 1;' : ''}" data-id="${prod.id}" ${prod.stock <= 0 ? 'disabled' : ''}>
              ${prod.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button class="buy-now-btn btn-buy-now" style="padding: 8px 4px; font-size:0.75rem; ${prod.stock <= 0 ? 'display: none;' : ''}" data-id="${prod.id}" ${prod.stock <= 0 ? 'disabled' : ''}>
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

      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

// Format slug to readable string (e.g. phone-covers -> Phone Covers)
function formatSlugName(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
