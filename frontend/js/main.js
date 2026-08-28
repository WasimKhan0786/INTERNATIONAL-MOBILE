// TechZone Mobile Accessories - Homepage Controller

document.addEventListener('DOMContentLoaded', async () => {
  // Load Banners
  initBanners();

  // Load Categories
  initCategories();

  // Load Products Grid Sections
  initProducts();

  // Load Customer Reviews
  initReviews();

  // Bind WhatsApp CTA Banner link
  const settings = await window.api.settings.get();
  const whatsappCta = document.getElementById('home-whatsapp-btn');
  if (whatsappCta && settings.whatsapp) {
    let cleanNumber = settings.whatsapp.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    if (!cleanNumber) {
      cleanNumber = '917654085663';
    }
    whatsappCta.href = `https://wa.me/${cleanNumber}?text=Hi,%20I%20want%20to%20place%20an%20order%20for%20mobile%20accessories.`;
  }
});

// 1. Carousel Initialization
async function initBanners() {
  const container = document.getElementById('hero-carousel-container');
  if (!container) return;

  try {
    const banners = await window.api.banners.getAll();
    if (banners.length === 0) {
      container.innerHTML = `
        <div style="color: white; text-align: center; padding: 100px 0;">
          <h2>Welcome to INTERNATIONAL MOBILE</h2>
          <p>Upgrade your mobile experience today!</p>
        </div>`;
      return;
    }

    let slidesHtml = '';
    let dotsHtml = '';

    banners.forEach((banner, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const badgeHtml = banner.discountBadge ? `<span class="hero-discount-badge">${banner.discountBadge}</span>` : '';
      
      slidesHtml += `
        <div class="hero-slide ${activeClass}" data-slide-index="${idx}">
          <img src="${banner.image}" alt="${banner.title}" class="hero-slide-bg" onerror="this.src='https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1600&auto=format&fit=crop&q=80'">
          <div class="container" style="position: relative; height: 100%; display: flex; align-items: center; justify-content: flex-start;">
            <div class="hero-slide-content">
              ${badgeHtml}
              <h1>${banner.title}</h1>
              <p>${banner.subtitle}</p>
              <a href="${banner.buttonUrl || 'shop.html'}" class="btn btn-primary">${banner.buttonText || 'Shop Now'}</a>
            </div>
          </div>
        </div>
      `;

      dotsHtml += `<button class="carousel-indicator-dot ${activeClass}" data-slide-to="${idx}"></button>`;
    });

    container.innerHTML = `
      ${slidesHtml}
      
      <!-- Controls -->
      <button class="carousel-control-btn prev" id="hero-prev-btn"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="carousel-control-btn next" id="hero-next-btn"><i class="fa-solid fa-chevron-right"></i></button>
      
      <!-- Indicators -->
      <div class="carousel-indicators">
        ${dotsHtml}
      </div>
    `;

    // Slide Controls logic
    setupCarouselLogic(banners.length);

  } catch (err) {
    console.error("Failed to load banners", err);
    container.innerHTML = `<div style="color: white; text-align: center; padding: 100px 0;">Failed to load slides</div>`;
  }
}

function setupCarouselLogic(slideCount) {
  let currentIdx = 0;
  let intervalId = null;
  const slideDuration = 3000; // 3 seconds per slide

  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.carousel-indicator-dot');
  const container = document.getElementById('hero-carousel-container');

  const goToSlide = (idx) => {
    slides[currentIdx].classList.remove('active');
    dots[currentIdx].classList.remove('active');
    
    currentIdx = (idx + slideCount) % slideCount;
    
    slides[currentIdx].classList.add('active');
    dots[currentIdx].classList.add('active');
  };

  const nextSlide = () => goToSlide(currentIdx + 1);
  const prevSlide = () => goToSlide(currentIdx - 1);

  const startAutoSlide = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(nextSlide, slideDuration);
  };

  const stopAutoSlide = () => {
    if (intervalId) clearInterval(intervalId);
  };

  // Nav clicks
  const nextBtn = document.getElementById('hero-next-btn');
  const prevBtn = document.getElementById('hero-prev-btn');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoSlide(); // reset timer
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoSlide(); // reset timer
    });
  }

  // Dots clicks
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.slideTo);
      goToSlide(index);
      startAutoSlide(); // reset timer
    });
  });

  // Pause on hover
  if (container) {
    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);
  }

  // Touch Gesture Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;

  if (container) {
    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoSlide();
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoSlide();
    }, { passive: true });
  }

  const handleSwipe = () => {
    const swipeThreshold = 50; // pixels
    const difference = touchStartX - touchEndX;

    if (difference > swipeThreshold) {
      nextSlide(); // Swiped left, show next
    } else if (difference < -swipeThreshold) {
      prevSlide(); // Swiped right, show prev
    }
  };

  startAutoSlide();
}

// 2. Categories Initialization
async function initCategories() {
  const grid = document.getElementById('home-categories-grid');
  if (!grid) return;

  grid.innerHTML = Array(4).fill(0).map(() => `<div class="skeleton-card" style="height: 120px;"></div>`).join('');

  try {
    const categories = await window.api.categories.getAll();
    grid.innerHTML = '';
    
    if (categories.length === 0) {
      grid.innerHTML = `<div class="empty-state">No categories defined yet</div>`;
      return;
    }

    categories.forEach(cat => {
      const card = document.createElement('a');
      card.href = `category.html?slug=${cat.slug}`;
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-icon-wrapper">
          <img src="${cat.image}" alt="${cat.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'">
        </div>
        <h3>${cat.name}</h3>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load categories", err);
    grid.innerHTML = `<div class="empty-state">Failed to load categories</div>`;
  }
}

// 3. Products Initialization
async function initProducts() {
  const featuredGrid = document.getElementById('home-featured-grid');
  const newArrivalsGrid = document.getElementById('home-new-arrivals-grid');
  const bestsellersGrid = document.getElementById('home-bestsellers-grid');

  const setSkeletons = (el) => {
    if (el) el.innerHTML = Array(4).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');
  };

  setSkeletons(featuredGrid);
  setSkeletons(newArrivalsGrid);
  setSkeletons(bestsellersGrid);

  try {
    const products = await window.api.products.getAll();
    
    // Sort / Filter sections
    const featured = products.filter(p => p.featured).slice(0, 4);
    const newArrivals = [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
    const bestsellers = products.filter(p => p.bestseller).slice(0, 4);

    renderProductGrid(featuredGrid, featured);
    renderProductGrid(newArrivalsGrid, newArrivals);
    renderProductGrid(bestsellersGrid, bestsellers);

  } catch (err) {
    console.error("Failed to load products grid", err);
  }
}

function renderProductGrid(element, productsList) {
  if (!element) return;
  element.innerHTML = '';

  if (productsList.length === 0) {
    element.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No products found in this section</div>`;
    return;
  }

  productsList.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Calculate discount percentages
    const hasDiscount = prod.discountPrice && prod.discountPrice < prod.price;
    const discountPct = hasDiscount ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100) : 0;
    
    // Badges HTML
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

    // Stars HTML
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
            <img src="${prod.images[0] ? (prod.images[0].url || prod.images[0]) : ''}" alt="${prod.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'">
        </a>
        <div class="product-badges">${badgeHtml}</div>
        ${window.getBrandLogoHtml ? window.getBrandLogoHtml(prod.brand) : ''}
        <button class="product-quickview-btn btn-quick-view" data-id="${prod.id}" title="Quick View"><i class="fa-regular fa-eye"></i></button>
        <button class="product-wishlist-btn" title="Add to Wishlist"><i class="fa-regular fa-heart"></i></button>
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

    // Bind Add to Cart / Buy Now actions
    card.querySelector('.btn-add-to-cart').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (prod.stock <= 0) return;
      window.cart.add(prod, 1);
    });

    card.querySelector('.btn-buy-now').addEventListener('click', async (e) => {
      e.stopPropagation();
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

    element.appendChild(card);
  });
}

// 4. Testimonials Initialization
async function initReviews() {
  const container = document.getElementById('home-reviews-grid');
  if (!container) return;

  try {
    const reviews = await window.api.reviews.getAll();
    container.innerHTML = '';
    
    if (reviews.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">No reviews posted yet.</p>`;
      return;
    }

    reviews.slice(0, 3).forEach(rev => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += i <= rev.rating ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
      }

      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-header">
          <span class="reviewer-name">${rev.name}</span>
          <span class="stars-rating" style="font-size: 0.8rem;">${starsHtml}</span>
        </div>
        <p class="review-comment">"${rev.comment}"</p>
        <div class="review-date">${rev.date}</div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load reviews", err);
  }
}
