// TechZone Mobile Accessories - Product Detail Controller

let currentProduct = null;
let currentQuantity = 1;
let selectedRating = 5;
let currentSlideIndex = 0;

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

    // Render Detail Badges
    const badgeContainer = document.getElementById('detail-badges');
    if (badgeContainer) {
      badgeContainer.innerHTML = '';
      let badgeHtml = '';
      
      const isNew = product.newArrival || window.isRecentAddition(product.createdAt);
      if (isNew) {
        badgeHtml += `<span class="badge badge-new"><i class="fa-solid fa-fire" style="margin-right: 4px;"></i> New</span>`;
      }
      if (product.bestseller) {
        badgeHtml += `<span class="badge badge-bestseller"><i class="fa-solid fa-crown" style="margin-right: 4px;"></i> Bestseller</span>`;
      }
      const hasDiscountVal = product.discountPrice && product.discountPrice < product.price;
      if (hasDiscountVal) {
        const savingPctVal = Math.round(((product.price - product.discountPrice) / product.price) * 100);
        badgeHtml += `<span class="badge badge-offer"><i class="fa-solid fa-tag" style="margin-right: 4px;"></i> ${savingPctVal}% OFF</span>`;
      }
      
      badgeContainer.innerHTML = badgeHtml;
    }

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

    // Price Per Piece display
    const pieceBox = document.getElementById('detail-price-per-piece-box');
    const pieceVal = document.getElementById('detail-price-per-piece-val');
    if (pieceBox && pieceVal) {
      if (product.pricePerPiece && Number(product.pricePerPiece) > 0) {
        pieceVal.textContent = `₹${product.pricePerPiece}`;
        pieceBox.style.display = 'block';
      } else {
        pieceBox.style.display = 'none';
      }
    }

    window.loadedProduct = product;

    // 4. Stock status
    const stockStatusEl = document.getElementById('detail-stock-status');
    const addCartBtn = document.getElementById('btn-detail-add-cart');
    const buyNowBtn = document.getElementById('btn-detail-buy-now');

    if (addCartBtn) {
      addCartBtn.dataset.id = product.id;
      addCartBtn.dataset.stock = product.stock;
    }
    if (buyNowBtn) {
      buyNowBtn.dataset.id = product.id;
      buyNowBtn.dataset.stock = product.stock;
    }

    updateProductDetailStockDisplay();

    // 5. Image gallery
    const mainImg = document.getElementById('gallery-main-image');
    mainImg.src = window.getOptimizedImageUrl(product.images[0], { width: 800 });
    mainImg.alt = product.name;

    const thumbRow = document.getElementById('gallery-thumbnails-row');
    if (thumbRow) {
      thumbRow.innerHTML = product.images.map((imgObj, idx) => {
        const imgUrl = window.getOptimizedImageUrl(imgObj, { width: 800 });
        const thumbUrl = window.getOptimizedImageUrl(imgObj, { width: 150 });
        const activeClass = idx === 0 ? 'active' : '';
        return `
          <div class="gallery-thumb-item ${activeClass}" data-image-url="${imgUrl}">
            <img src="${thumbUrl}" alt="${product.name}">
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

    window.cart.updateDOMButtons();

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

  qtyInput.oninput = () => {
    let val = parseInt(qtyInput.value);
    if (isNaN(val)) return; // Allow typing
    if (val < 1) val = 1;
    if (val > currentProduct.stock) {
      window.showToast(`Only ${currentProduct.stock} units of this accessory are available in stock.`, "error");
      val = currentProduct.stock;
    }
    currentQuantity = val;
    qtyInput.value = val;
    triggerQuantityUpdate();
  };

  qtyInput.onchange = () => {
    let val = parseInt(qtyInput.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > currentProduct.stock) {
      window.showToast(`Only ${currentProduct.stock} units of this accessory are available in stock.`, "error");
      val = currentProduct.stock;
    }
    currentQuantity = val;
    qtyInput.value = val;
    triggerQuantityUpdate();
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

  let cleanNum = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';
  if (cleanNum.length === 10) {
    cleanNum = '91' + cleanNum;
  }
  if (!cleanNum) {
    cleanNum = '917654085663';
  }
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

  const whatsappUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(textMsg)}`;
  btn.href = whatsappUrl;

  // Intercept click to capture customer name/mobile
  if (!btn.dataset.bound) {
    btn.dataset.bound = "true";
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showWhatsAppDetailsModal(whatsappUrl, itemPrice, totalCost, settings);
    });
  }
}

// Show WhatsApp Details Modal and Log to DB
function showWhatsAppDetailsModal(whatsappUrl, itemPrice, totalCost, settings) {
  const modal = document.getElementById('whatsapp-order-modal');
  if (!modal) return;

  modal.classList.add('show');

  const closeBtn = document.getElementById('whatsapp-order-modal-close');
  const form = document.getElementById('whatsapp-order-details-form');

  const closeModal = () => {
    modal.classList.remove('show');
    form.reset();
  };

  // Rebind close button to avoid multiple listeners
  const newClose = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newClose, closeBtn);
  newClose.addEventListener('click', closeModal);

  // Rebind form to prevent multiple submissions
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const custName = newForm.querySelector('#wa-cust-name').value.trim();
    const custPhone = newForm.querySelector('#wa-cust-phone').value.trim();
    const submitBtn = newForm.querySelector('#btn-wa-modal-submit');

    if (!custName || !custPhone) {
      window.showToast("Please enter your name and phone number.", "error");
      return;
    }

    if (custPhone.length !== 10 || isNaN(custPhone)) {
      window.showToast("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    // Build pending order data structure
    const orderData = {
      customerName: custName,
      shopName: settings.shopName || "INTERNATIONAL MOBILE",
      mobile: custPhone,
      email: '',
      products: [{
        id: currentProduct.id,
        name: currentProduct.name,
        brand: currentProduct.brand || '',
        price: itemPrice,
        image: currentProduct.images[0] ? (currentProduct.images[0].url || currentProduct.images[0]) : '',
        quantity: currentQuantity,
        sku: currentProduct.sku || ''
      }],
      subtotal: totalCost,
      deliveryCharge: 0,
      discount: 0,
      total: totalCost,
      paymentMethod: 'WhatsApp Order',
      address: 'WhatsApp Order',
      city: 'WhatsApp Order',
      state: 'WhatsApp Order',
      pincode: '000000',
      orderNotes: 'WhatsApp Order Initiated'
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
      // 1. Log order to database (creates a Customer profile dynamically in admin)
      await window.api.orders.create(orderData);
      
      // 2. Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // 3. Close modal & show toast
      window.showToast("Redirecting to WhatsApp...", "success");
      closeModal();
    } catch (err) {
      console.error(err);
      window.showToast(err.message || "Failed to log order.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Confirm & Order on WhatsApp';
    }
  });
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

    // Reset slide position & bind controls
    currentSlideIndex = 0;
    setupReviewsCarousel();

  } catch (err) {
    console.error(err);
  }
}

// Bind reviews carousel/slider controls
function setupReviewsCarousel() {
  const prevBtn = document.getElementById('btn-review-prev');
  const nextBtn = document.getElementById('btn-review-next');
  const track = document.getElementById('product-reviews-list');
  
  if (!prevBtn || !nextBtn || !track) return;

  // Unbind old events if setupReviewsCarousel is recalled
  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);

  const updateSlidePosition = () => {
    const card = track.querySelector('.review-card');
    if (!card) return;
    const cardWidth = card.offsetWidth + 20; // card width + gap
    track.style.transform = `translateX(-${currentSlideIndex * cardWidth}px)`;
  };

  // Reset track translation
  track.style.transform = 'translateX(0)';

  newPrev.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      updateSlidePosition();
    }
  });

  newNext.addEventListener('click', () => {
    const cards = track.querySelectorAll('.review-card');
    const visibleCards = window.innerWidth >= 768 ? 2 : 1;
    const maxIndex = cards.length - visibleCards;
    if (currentSlideIndex < maxIndex) {
      currentSlideIndex++;
      updateSlidePosition();
    }
  });

  // Re-align on window resize
  window.addEventListener('resize', updateSlidePosition);
}

// Submit custom review
async function handleReviewSubmit(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('rev-username');
  const commentInput = document.getElementById('rev-comment');

  if (!nameInput || !commentInput) return;

  try {
    await window.api.reviews.create({
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
        if (prod.newArrival || window.isRecentAddition(prod.createdAt)) {
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
            <img src="${window.getOptimizedImageUrl(prod.images[0], { width: 600 })}" alt="${prod.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'">
          </a>
          <div class="product-badges">${badgeHtml}</div>
          <button class="product-wishlist-btn" title="Add to Wishlist"><i class="fa-regular fa-heart"></i></button>
        </div>
        <div class="product-info">
          <div class="product-brand">${prod.brand}</div>
          <a href="product.html?id=${prod.id}" class="product-title" title="${prod.name}">${prod.name}</a>
          <div class="product-stock-display" data-id="${prod.id}" style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;"></div>
          <div class="product-price-wrapper" style="margin-bottom: 12px;">
            ${priceHtml}
          </div>
          <div class="product-card-actions">
            <button class="add-cart-btn btn-add-to-cart" style="padding: 8px 4px; font-size:0.75rem; ${prod.stock <= 0 ? 'background-color: var(--text-muted); cursor: not-allowed; width: 100%; flex: 1;' : ''}" data-id="${prod.id}" data-stock="${prod.stock}" ${prod.stock <= 0 ? 'disabled' : ''}>
              ${prod.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button class="buy-now-btn btn-buy-now" style="padding: 8px 4px; font-size:0.75rem; ${prod.stock <= 0 ? 'display: none;' : ''}" data-id="${prod.id}" data-stock="${prod.stock}" ${prod.stock <= 0 ? 'disabled' : ''}>
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

// Update the main product detail page's stock quantity and badge in real-time
function updateProductDetailStockDisplay() {
  const product = window.loadedProduct;
  if (!product) return;

  const stockStatusEl = document.getElementById('detail-stock-status');
  const addCartBtn = document.getElementById('btn-detail-add-cart');
  const buyNowBtn = document.getElementById('btn-detail-buy-now');
  if (!stockStatusEl || !addCartBtn) return;

  const cartItems = window.cart.get();
  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const remainingStock = Math.max(0, product.stock - cartQty);

  if (remainingStock <= 0) {
    stockStatusEl.innerHTML = `<span class="stock-status stock-outofstock"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
    addCartBtn.disabled = true;
    if (buyNowBtn) buyNowBtn.disabled = true;
    addCartBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Out of Stock';
    addCartBtn.style.backgroundColor = 'var(--text-muted)';
    addCartBtn.style.borderColor = 'var(--text-muted)';
    addCartBtn.style.cursor = 'not-allowed';
    if (buyNowBtn) buyNowBtn.style.display = 'none';
  } else if (remainingStock < 10) {
    stockStatusEl.innerHTML = `<span class="stock-status stock-low"><i class="fa-solid fa-circle-exclamation"></i> Low Stock! Only ${remainingStock} left</span>`;
    addCartBtn.disabled = false;
    if (buyNowBtn) buyNowBtn.disabled = false;
    addCartBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';
    addCartBtn.style.backgroundColor = '';
    addCartBtn.style.borderColor = '';
    addCartBtn.style.cursor = '';
    if (buyNowBtn) buyNowBtn.style.display = '';
  } else {
    stockStatusEl.innerHTML = `<span class="stock-status stock-instock"><i class="fa-solid fa-circle-check"></i> In Stock (${remainingStock} units left)</span>`;
    addCartBtn.disabled = false;
    if (buyNowBtn) buyNowBtn.disabled = false;
    addCartBtn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Add to Cart';
    addCartBtn.style.backgroundColor = '';
    addCartBtn.style.borderColor = '';
    addCartBtn.style.cursor = '';
    if (buyNowBtn) buyNowBtn.style.display = '';
  }
}

// React to cart modifications in real-time
window.addEventListener('cartUpdated', () => {
  updateProductDetailStockDisplay();
});
