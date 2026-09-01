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

  // Fetch Settings & Check Festival / Flash Sale / Spin Wheel Mode Flags
  const settings = await window.api.settings.get();
  initFestivalOffers(settings);
  initFlashSale(settings);
  initSpinWheelGame(settings);

  // Bind WhatsApp CTA Banner link
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

let flashSaleInterval = null;

// Real-Time Countdown Timer & Flash Sale Initialization
function initFlashSale(settings) {
  const flashSection = document.getElementById('flash-sale-section');
  if (!flashSection) return;

  if (settings && settings.flashSaleActive) {
    flashSection.style.display = 'block';

    const titleEl = document.getElementById('flash-sale-title');
    const badgeEl = document.getElementById('flash-sale-badge');
    const subtitleEl = document.getElementById('flash-sale-subtitle');

    if (titleEl && settings.flashSaleTitle) {
      titleEl.innerHTML = settings.flashSaleTitle;
    }
    if (badgeEl && settings.flashSaleDiscountBadge) {
      badgeEl.innerHTML = `⚡ ${settings.flashSaleDiscountBadge}`;
    }
    if (subtitleEl && settings.flashSaleSubtitle) {
      subtitleEl.innerHTML = settings.flashSaleSubtitle;
    }

    // Target end time
    let targetTime = settings.flashSaleEndTime ? new Date(settings.flashSaleEndTime).getTime() : (Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const distance = targetTime - now;

      if (distance <= 0) {
        if (flashSaleInterval) clearInterval(flashSaleInterval);
        flashSection.style.display = 'none';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const daysEl = document.getElementById('timer-days');
      const hoursEl = document.getElementById('timer-hours');
      const minutesEl = document.getElementById('timer-minutes');
      const secondsEl = document.getElementById('timer-seconds');

      if (daysEl) daysEl.textContent = days < 10 ? '0' + days : days;
      if (hoursEl) hoursEl.textContent = hours < 10 ? '0' + hours : hours;
      if (minutesEl) minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
      if (secondsEl) secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
    };

    updateTimer();
    if (flashSaleInterval) clearInterval(flashSaleInterval);
    flashSaleInterval = setInterval(updateTimer, 1000);

  } else {
    flashSection.style.display = 'none';
    if (flashSaleInterval) clearInterval(flashSaleInterval);
  }
}

// Interactive Spin the Wheel Game Initialization
function initSpinWheelGame(settings) {
  const floatBtn = document.getElementById('spin-wheel-floating-btn');
  const modal = document.getElementById('spin-wheel-modal');
  const closeBtn = document.getElementById('spin-modal-close-btn');
  const spinBtn = document.getElementById('btn-spin-now');
  const canvas = document.getElementById('spin-canvas');
  const copyBtn = document.getElementById('btn-copy-spin-coupon');

  if (!floatBtn || !modal || !canvas) return;

  const campaignTime = settings ? settings.updatedAt : '';
  const usedCampaignTime = localStorage.getItem('techzone_coupon_used_campaign_time');
  const hasUsedForThisCampaign = (usedCampaignTime === campaignTime);

  if (settings && settings.spinWheelActive && !hasUsedForThisCampaign) {
    floatBtn.style.display = 'flex';

    const titleEl = document.getElementById('spin-game-title');
    const subtitleEl = document.getElementById('spin-game-subtitle');
    if (titleEl && settings.spinWheelTitle) titleEl.innerHTML = settings.spinWheelTitle;
    if (subtitleEl && settings.spinWheelSubtitle) subtitleEl.innerHTML = settings.spinWheelSubtitle;

    // Wheel Slices Data (Contains winning discount slices and empty "Try Again" slices)
    const slices = [
      { text: '10% OFF', code: 'FESTIVE10', color: '#ff5722', isWin: true },
      { text: 'Try Again 😢', code: '', color: '#64748b', isWin: false },
      { text: 'Free Ship', code: 'FREESHIP', color: '#2563eb', isWin: true },
      { text: '15% OFF', code: 'MEGA15', color: '#10b981', isWin: true },
      { text: 'Better Luck 😢', code: '', color: '#475569', isWin: false },
      { text: 'Free Gift', code: 'FREEGIFT', color: '#7c3aed', isWin: true },
      { text: '20% OFF', code: 'SUPER20', color: '#db2777', isWin: true },
      { text: '5% OFF', code: 'LUCKY5', color: '#f59e0b', isWin: true }
    ];

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    let currentAngle = 0;
    let isSpinning = false;

    // Check if user has already spun previously
    const savedSpin = localStorage.getItem('techzone_spin_result');
    let hasSpun = false;

    // Draw HTML5 Canvas Wheel
    const drawWheel = (angleOffset = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sliceAngle = (2 * Math.PI) / slices.length;

      slices.forEach((slice, idx) => {
        const startAngle = angleOffset + idx * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = slice.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Draw slice text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(slice.text, radius - 18, 4);
        ctx.restore();
      });
    };

    if (savedSpin) {
      try {
        const parsed = JSON.parse(savedSpin);
        hasSpun = true;
        currentAngle = parsed.angle || 0;
        drawWheel(currentAngle);

        const resultBox = document.getElementById('spin-result-container');
        const prizeTitle = document.getElementById('spin-prize-title');
        const prizeDesc = document.getElementById('spin-prize-desc');
        const couponCode = document.getElementById('spin-coupon-code');

        if (resultBox && prizeDesc && couponCode && parsed.winningSlice) {
          if (parsed.winningSlice.isWin) {
            if (prizeTitle) prizeTitle.textContent = '🎉 Congratulations!';
            prizeDesc.textContent = `You won '${parsed.winningSlice.text}'! Use coupon code below at checkout.`;
            couponCode.textContent = parsed.winningSlice.code;
            couponCode.parentElement.style.display = 'flex';
          } else {
            if (prizeTitle) prizeTitle.textContent = '😢 Better Luck Next Time!';
            prizeDesc.textContent = `No discount prize won this time. Thank you for playing!`;
            couponCode.parentElement.style.display = 'none';
          }
          resultBox.style.display = 'block';
        }

        if (spinBtn) {
          spinBtn.disabled = true;
          spinBtn.textContent = 'DONE';
          spinBtn.style.fontSize = '0.75rem';
        }
      } catch (e) {
        drawWheel(0);
      }
    } else {
      drawWheel(0);
    }

    // Modal Open & Close Listeners
    floatBtn.onclick = () => {
      modal.classList.add('show');
    };
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove('show');
      };
    }
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('show');
    };

    // Slice selection algorithm based on Admin difficulty settings
    const selectWinningSliceIndex = () => {
      const difficulty = settings.spinDifficulty || 'normal';
      const emptyIndices = [1, 4];
      const winIndices = [0, 2, 3, 5, 6, 7];

      if (difficulty === 'always_lose') {
        return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }

      const rand = Math.random() * 100;

      if (difficulty === 'hard') {
        // 80% chance of empty, 20% chance of win
        return rand < 80 ? emptyIndices[Math.floor(Math.random() * emptyIndices.length)] : winIndices[Math.floor(Math.random() * winIndices.length)];
      } else if (difficulty === 'easy') {
        // 90% chance of win, 10% chance of empty
        return rand < 10 ? emptyIndices[Math.floor(Math.random() * emptyIndices.length)] : winIndices[Math.floor(Math.random() * winIndices.length)];
      } else {
        // Normal mode: 50% win vs 50% empty
        return rand < 50 ? emptyIndices[Math.floor(Math.random() * emptyIndices.length)] : winIndices[Math.floor(Math.random() * winIndices.length)];
      }
    };

    // Spin Animation Logic
    if (spinBtn) {
      if (hasSpun) {
        spinBtn.disabled = true;
        spinBtn.textContent = 'DONE';
        spinBtn.style.fontSize = '0.75rem';
      }

      spinBtn.onclick = () => {
        if (isSpinning || hasSpun || localStorage.getItem('techzone_spin_result')) return;
        isSpinning = true;
        spinBtn.disabled = true;

        // Calculate slice selection according to admin win rate difficulty
        const winningIdx = selectWinningSliceIndex();
        const sliceAngle = (2 * Math.PI) / slices.length;
        
        // Pointer is at top (-90 degrees / 3*PI/2)
        const targetAngle = (3 * Math.PI / 2) - (winningIdx * sliceAngle) - (sliceAngle / 2) + (8 * 2 * Math.PI);
        
        const startTime = performance.now();
        const duration = 4000; // 4 seconds spin animation

        const animateSpin = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease out cubic formula
          const easeOut = 1 - Math.pow(1 - progress, 3);
          currentAngle = easeOut * targetAngle;

          drawWheel(currentAngle);

          if (progress < 1) {
            requestAnimationFrame(animateSpin);
          } else {
            isSpinning = false;
            hasSpun = true;
            const winningSlice = slices[winningIdx];
            
            // Save to localStorage so reloading doesn't allow re-spinning
            localStorage.setItem('techzone_spin_result', JSON.stringify({
              winningSlice,
              winningIdx,
              angle: targetAngle
            }));

            // Display result
            const resultBox = document.getElementById('spin-result-container');
            const prizeTitle = document.getElementById('spin-prize-title');
            const prizeDesc = document.getElementById('spin-prize-desc');
            const couponCode = document.getElementById('spin-coupon-code');

            if (resultBox && prizeDesc && couponCode) {
              if (winningSlice.isWin) {
                if (prizeTitle) prizeTitle.textContent = '🎉 Congratulations!';
                prizeDesc.textContent = `You won '${winningSlice.text}'! Use coupon code below at checkout.`;
                couponCode.textContent = winningSlice.code;
                couponCode.parentElement.style.display = 'flex';
              } else {
                if (prizeTitle) prizeTitle.textContent = '😢 Better Luck Next Time!';
                prizeDesc.textContent = `No discount prize won this time. Thank you for playing!`;
                couponCode.parentElement.style.display = 'none';
              }
              resultBox.style.display = 'block';
            }
            spinBtn.textContent = 'DONE';
            spinBtn.style.fontSize = '0.75rem';
          }
        };

        requestAnimationFrame(animateSpin);
      };
    }

    // Copy Coupon Code Button
    if (copyBtn) {
      copyBtn.onclick = () => {
        const code = document.getElementById('spin-coupon-code').textContent;
        navigator.clipboard.writeText(code);
        window.showToast(`Coupon code '${code}' copied to clipboard!`, "success");
      };
    }

  } else {
    floatBtn.style.display = 'none';
    modal.style.display = 'none';
  }
}

// 0. Festival Offers Banner Initialization (Conditionally rendered from DB settings)
function initFestivalOffers(settings) {
  const festivalSection = document.getElementById('festival-offers-section');
  if (!festivalSection) return;

  if (settings && settings.festivalModeActive) {
    festivalSection.style.display = 'block';

    const titleEl = document.getElementById('festival-title');
    const badgeEl = document.getElementById('festival-badge');
    const subtitleEl = document.getElementById('festival-subtitle');

    if (titleEl && settings.festivalTitle) {
      titleEl.innerHTML = settings.festivalTitle;
    }
    if (badgeEl && settings.festivalDiscountBadge) {
      badgeEl.innerHTML = `🎉 ${settings.festivalDiscountBadge}`;
    }
    if (subtitleEl && settings.festivalSubtitle) {
      subtitleEl.innerHTML = settings.festivalSubtitle;
    }
  } else {
    festivalSection.style.display = 'none';
  }
}

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
      const loadingAttr = idx === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
      
      slidesHtml += `
        <div class="hero-slide ${activeClass}" data-slide-index="${idx}">
          <img src="${window.getOptimizedImageUrl(banner.image, { width: 1600 })}" alt="${banner.title}" class="hero-slide-bg" ${loadingAttr} onerror="this.src='https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1600&auto=format&fit=crop&q=80'">
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

      dotsHtml += `<button class="carousel-indicator-dot ${activeClass}" data-slide-to="${idx}" aria-label="Go to slide ${idx + 1}"></button>`;
    });

    container.innerHTML = `
      ${slidesHtml}
      
      <!-- Controls -->
      <button class="carousel-control-btn prev" id="hero-prev-btn" aria-label="Previous Slide"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="carousel-control-btn next" id="hero-next-btn" aria-label="Next Slide"><i class="fa-solid fa-chevron-right"></i></button>
      
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

    let showingAll = false;

    const renderGrid = (list) => {
      grid.innerHTML = '';
      list.forEach(cat => {
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
    };

    if (categories.length <= 6) {
      renderGrid(categories);
    } else {
      // Render first 6 by default
      renderGrid(categories.slice(0, 6));

      // Append See All button container dynamically if it doesn't exist
      let btnContainer = document.getElementById('btn-see-all-categories-container');
      if (!btnContainer) {
        btnContainer = document.createElement('div');
        btnContainer.id = 'btn-see-all-categories-container';
        btnContainer.style.cssText = 'text-align: center; margin-top: 30px; width: 100%; grid-column: 1 / -1;';
        btnContainer.innerHTML = `
          <button type="button" class="btn btn-outline" id="btn-see-all-categories" style="padding: 10px 24px; font-weight: 700;">See All Categories</button>
        `;
        grid.parentNode.appendChild(btnContainer);
      }

      const seeAllBtn = document.getElementById('btn-see-all-categories');
      if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
          showingAll = !showingAll;
          if (showingAll) {
            renderGrid(categories);
            seeAllBtn.textContent = 'Show Less';
          } else {
            renderGrid(categories.slice(0, 6));
            seeAllBtn.textContent = 'See All Categories';
          }
        });
      }
    }
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

    window.cart.updateDOMButtons();

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
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); width: 100%;">No reviews posted yet.</p>`;
      return;
    }

    // Render all reviews in the slider track
    reviews.forEach(rev => {
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += i <= rev.rating ? `<i class="fa-solid fa-star"></i>` : `<i class="fa-regular fa-star"></i>`;
      }

      const card = document.createElement('div');
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-header">
          <span class="reviewer-name">${rev.customerName || rev.name || 'Verified Buyer'}</span>
          <span class="stars-rating" style="font-size: 0.8rem;">${starsHtml}</span>
        </div>
        <p class="review-comment">"${rev.comment}"</p>
        <div class="review-date">${rev.date || new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      `;
      container.appendChild(card);
    });

    // Auto-scroll loop logic for slider (every 3 seconds)
    let currentIndex = 0;
    const cards = container.querySelectorAll('.review-card');
    if (cards.length <= 1) return; // No need to slide if only 1 review exists

    const slideReviews = () => {
      const isMobile = window.innerWidth < 768;
      const cardsToShow = isMobile ? 1 : 2;
      const maxIndex = cards.length - cardsToShow;

      if (currentIndex >= maxIndex) {
        currentIndex = 0; // Reset loop to start
      } else {
        currentIndex++;
      }

      // Calculate translate dimensions based on mobile/desktop display columns and gap sizes
      const percentage = isMobile ? (currentIndex * 100) : (currentIndex * 50);
      const gapOffset = isMobile ? (currentIndex * 20) : (currentIndex * 10);
      container.style.transform = `translateX(calc(-${percentage}% - ${gapOffset}px))`;
    };

    let autoSlideInterval = setInterval(slideReviews, 3000);

    // Pause auto-sliding on hover for enhanced user reading accessibility
    container.addEventListener('mouseenter', () => {
      clearInterval(autoSlideInterval);
    });
    container.addEventListener('mouseleave', () => {
      autoSlideInterval = setInterval(slideReviews, 3000);
    });

  } catch (err) {
    console.error("Failed to load reviews", err);
  }
}
