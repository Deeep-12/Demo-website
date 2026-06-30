// Organic Garden - Shared Client-Side Javascript Architecture
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialization and Setup
  initNavigation();
  initCart();
  initHeaderScroll();
  initNewsletterForm();
});

/* ==========================================================================
   1. NAVIGATION LOGIC
   ========================================================================== */
function initNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // Set active link based on current page filename
  const path = window.location.pathname;
  const page = path.split("/").pop() || 'index.html';
  const navLinksArray = document.querySelectorAll('.nav-links a');
  
  navLinksArray.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================================================
   2. HEADER SCROLL LOGIC
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    };
    
    // Check on initial load
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

/* ==========================================================================
   3. CART MANAGEMENT STATE
   ========================================================================== */
// Cart Store definition
const CartStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('organic_garden_cart')) || [];
    } catch (e) {
      console.error('Error loading cart data, resetting.', e);
      return [];
    }
  },

  set(cart) {
    localStorage.setItem('organic_garden_cart', JSON.stringify(cart));
    // Dispatch a custom event to notify any open page parts
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  },

  add(product) {
    const cart = this.get();
    const qtyAdded = product.quantity || 1;
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += qtyAdded;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageSvg: product.imageSvg || '',
        quantity: qtyAdded
      });
    }
    
    this.set(cart);
    this.animateBadge();

    // Trigger add_to_cart tracking event
    if (window.trackEcommerceEvent) {
      window.trackEcommerceEvent('add_to_cart', {
        currency: 'INR',
        value: product.price * qtyAdded,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.price,
            item_category: product.category,
            quantity: qtyAdded
          }
        ]
      });
    }
  },

  remove(productId) {
    let cart = this.get();
    cart = cart.filter(item => item.id !== productId);
    this.set(cart);
    this.animateBadge();
  },

  updateQty(productId, qty) {
    const cart = this.get();
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, parseInt(qty) || 1);
      this.set(cart);
    }
  },

  clear() {
    this.set([]);
  },

  count() {
    return this.get().reduce((sum, item) => sum + item.quantity, 0);
  },

  subtotal() {
    return this.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  animateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.classList.remove('bump');
      // Trigger reflow to restart animation
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
  }
};

// Hook up cart badge changes to DOM
function initCart() {
  const updateBadgeDOM = () => {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const count = CartStore.count();
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('show');
      } else {
        badge.classList.remove('show');
      }
    }
  };

  // Initial load update
  updateBadgeDOM();

  // Listen to local changes
  window.addEventListener('cartUpdated', updateBadgeDOM);
}

/* ==========================================================================
   4. NEWSLETTER FORM HANDLER
   ========================================================================== */
function initNewsletterForm() {
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value.trim() !== '') {
        const email = input.value.trim();
        showNotificationModal('Stay Rooted!', `Thank you for subscribing with <strong>${email}</strong>! Get ready for seasonal gardening tips, product announcements, and exclusive seeds discounts!`);
        input.value = '';
      }
    });
  }
}

/* ==========================================================================
   5. NOTIFICATION MODAL BUILDER (MODERN POPUP DIALOG)
   ========================================================================== */
function showNotificationModal(title, bodyHtml) {
  // Remove existing dynamic modal if any
  const existing = document.getElementById('dynamic-notification-modal');
  if (existing) existing.remove();

  const modalHtml = `
    <div id="dynamic-notification-modal" class="modal">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 19H4.47L12 5.99zM13 16h-2v2h2v-2zm0-6h-2v4h2v-4z" style="display:none;"/>
            <!-- Custom Leaf SVG path for green vibe -->
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12A10 10 0 0 1 12 2zm0 2a8 8 0 0 0-8 8c0 4.42 3.58 8 8 8s8-3.58 8-8a8 8 0 0 0-8-8zm-1 3h2v6h-2V7zm0 8h2v2h-2v-2z" style="display:none;" />
            <!-- Checkmark circle -->
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"></circle>
            <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
          </svg>
        </div>
        <h3 class="modal-title font-serif">${title}</h3>
        <p class="modal-body">${bodyHtml}</p>
        <button class="btn btn--primary close-modal-btn" style="width: 100%;">Wonderful</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  const modal = document.getElementById('dynamic-notification-modal');
  const closeBtn = modal.querySelector('.close-modal-btn');
  const overlay = modal.querySelector('.modal-overlay');

  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Trigger reflow to animate
  void modal.offsetWidth;
  modal.classList.add('show');
}

// Export modules to window scope for page specific scripts
window.CartStore = CartStore;
window.showNotificationModal = showNotificationModal;
window.showProductDetailModal = showProductDetailModal;

/* ==========================================================================
   6. PRODUCT DETAIL MODAL BUILDER
   ========================================================================== */
function showProductDetailModal(product) {
  // Remove existing dynamic modal if any
  const existing = document.getElementById('dynamic-product-modal');
  if (existing) existing.remove();

  // Trigger view_item event!
  if (window.trackEcommerceEvent) {
    window.trackEcommerceEvent('view_item', {
      currency: 'INR',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          quantity: 1
        }
      ]
    });
  }

  const modalHtml = `
    <div id="dynamic-product-modal" class="modal">
      <div class="modal-overlay"></div>
      <div class="modal-content product-detail-modal" style="max-width: 550px; padding: var(--spacing-xl); text-align: left; position: relative;">
        <button class="close-modal-x" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--text-muted); line-height: 1;">&times;</button>
        <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
          <div style="background-color: var(--bg-cream); border-radius: var(--radius-md); overflow: hidden; display: flex; align-items: center; justify-content: center; height: 220px; border: 1px solid var(--border-light); padding: var(--spacing-md);">
            ${product.imageSvg || `
              <svg viewBox="0 0 100 100" style="width: 80px; height: 80px;" fill="none" stroke="var(--primary-forest)" stroke-width="2">
                <circle cx="50" cy="50" r="40"></circle>
              </svg>
            `}
          </div>
          <div>
            <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; font-weight: 700;">
              ${product.category}
            </span>
            <h3 class="font-serif" style="font-size: 1.8rem; margin: 4px 0 var(--spacing-xs); color: var(--primary-forest);">${product.name}</h3>
            
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: var(--spacing-md);">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#E9B862" style="margin-top:-2px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-dark);">${product.rating || '4.8'}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted);">(${product.reviews || '80'} reviews)</span>
            </div>

            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: var(--spacing-lg);">
              Bring natural vibrancy and sustainable ecology to your home. Meticulously tested for viability and quality. Easy to care for and perfect for green living enthusiasts.
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); padding-top: var(--spacing-md);">
              <span style="font-size: 1.5rem; font-weight: 800; color: var(--primary-forest);">₹${product.price.toFixed(2)}</span>
              <button class="btn btn--primary modal-add-btn" style="padding: 0.8rem var(--spacing-xl);">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  const modal = document.getElementById('dynamic-product-modal');
  const closeX = modal.querySelector('.close-modal-x');
  const overlay = modal.querySelector('.modal-overlay');
  const addBtn = modal.querySelector('.modal-add-btn');

  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };

  closeX.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  addBtn.addEventListener('click', () => {
    window.CartStore.add(product);
    closeModal();
    window.showNotificationModal('Sprout Added!', `<strong>${product.name}</strong> was successfully added to your shopping cart.`);
  });

  // Trigger reflow to animate
  void modal.offsetWidth;
  modal.classList.add('show');
}

/* ==========================================================================
   7. GA4 & GTM ECOMMERCE EVENT TRACKING HELPERS
   ========================================================================== */
window.trackEcommerceEvent = function(eventName, ecommerceData) {
  window.dataLayer = window.dataLayer || [];
  
  // Clear the previous ecommerce object to prevent parameter leakage
  window.dataLayer.push({ ecommerce: null });
  
  // Create payload with both root and ecommerce properties
  const payload = {
    event: eventName,
    currency: ecommerceData.currency,
    value: ecommerceData.value,
    items: ecommerceData.items,
    ...ecommerceData,
    ecommerce: ecommerceData
  };
  
  console.log(`[GA4/GTM Tracking] Pushing event "${eventName}":`, payload);
  window.dataLayer.push(payload);
};
