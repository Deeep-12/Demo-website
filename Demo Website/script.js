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
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      existing.quantity += (product.quantity || 1);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageSvg: product.imageSvg || '',
        quantity: product.quantity || 1
      });
    }
    
    this.set(cart);
    this.animateBadge();
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
