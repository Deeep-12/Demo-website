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
    const itemToRemove = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    this.set(cart);
    this.animateBadge();

    // Trigger remove_from_cart tracking event
    if (itemToRemove && window.trackEcommerceEvent) {
      window.trackEcommerceEvent('remove_from_cart', {
        currency: 'INR',
        value: itemToRemove.price * itemToRemove.quantity,
        items: [
          {
            item_id: itemToRemove.id,
            item_name: itemToRemove.name,
            price: itemToRemove.price,
            item_category: itemToRemove.category,
            quantity: itemToRemove.quantity
          }
        ]
      });
    }
  },

  updateQty(productId, qty) {
    const cart = this.get();
    const item = cart.find(item => item.id === productId);
    if (item) {
      const oldQty = item.quantity;
      const newQty = Math.max(1, parseInt(qty) || 1);
      if (oldQty !== newQty) {
        item.quantity = newQty;
        this.set(cart);

        // Trigger add_to_cart or remove_from_cart based on difference
        if (window.trackEcommerceEvent) {
          const diff = newQty - oldQty;
          const eventName = diff > 0 ? 'add_to_cart' : 'remove_from_cart';
          const absDiff = Math.abs(diff);
          window.trackEcommerceEvent(eventName, {
            currency: 'INR',
            value: item.price * absDiff,
            items: [
              {
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                item_category: item.category,
                quantity: absDiff
              }
            ]
          });
        }
      }
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

const PRODUCTS_DB = [
  {
    id: "p1",
    name: "French Lavender Seeds",
    price: 149.00,
    category: "Seeds",
    subcategory: "Flowers",
    rating: 4.9,
    reviews: 128,
    badge: "Heirloom",
    description: "Bring natural beauty and sweet lavender fragrance to your garden. High viability non-GMO organic heirloom seeds.",
    galleryImages: ["/assets/lavender_seeds.png", "/assets/hero_garden.png", "/assets/basil_seeds.png"],
    imageSvg: `<img src="/assets/lavender_seeds.png" alt="French Lavender Seeds" class="product-art" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" />`
  },
  {
    id: "p2",
    name: "Stripe-Leafed Calathea",
    price: 799.00,
    category: "Plants",
    subcategory: "Live Plants",
    rating: 4.8,
    reviews: 94,
    badge: "Bestseller",
    description: "A beautiful stripe-leafed Calathea indoor live plant. Features striking patterned foliage that opens and closes with light cycles.",
    galleryImages: ["/assets/calathea_plant.png", "/assets/hero_garden.png", "/assets/watering_can.png"],
    imageSvg: `<img src="/assets/calathea_plant.png" alt="Stripe-Leafed Calathea" class="product-art" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" />`
  },
  {
    id: "p3",
    name: "Organic Sweet Basil Seeds",
    price: 99.00,
    category: "Seeds",
    subcategory: "Vegetables",
    rating: 5.0,
    reviews: 202,
    badge: "Organic",
    description: "Aromatic and delicious sweet basil seeds. Meticulously tested for high germination and rapid microgreen growth.",
    galleryImages: ["/assets/basil_seeds.png", "/assets/hero_garden.png", "/assets/lavender_seeds.png"],
    imageSvg: `<img src="/assets/basil_seeds.png" alt="Organic Sweet Basil Seeds" class="product-art" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" />`
  },
  {
    id: "p4",
    name: "Classic Brass Watering Can",
    price: 1299.00,
    category: "Essentials",
    subcategory: "Tools",
    rating: 4.7,
    reviews: 78,
    badge: "Eco Friendly",
    description: "Artisan brass watering can with an ergonomic loop handle. Designed for delicate direct sprout hydration and premium style.",
    galleryImages: ["/assets/watering_can.png", "/assets/hero_garden.png", "/assets/calathea_plant.png"],
    imageSvg: `<img src="/assets/watering_can.png" alt="Classic Brass Watering Can" class="product-art" style="width:100%; height:100%; object-fit:cover; border-radius:var(--radius-md);" />`
  },
  {
    id: "p5",
    name: "Sun Gold Cherry Tomato Seeds",
    price: 129.00,
    category: "Seeds",
    subcategory: "Vegetables",
    rating: 4.9,
    reviews: 165,
    badge: "High Yield",
    description: "High yield golden yellow cherry tomato seeds. Sweet flavor profile and sturdy vines perfect for patio pots.",
    galleryImages: ["SVG_MAIN", "SVG_SOWING", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <rect x="25" y="15" width="70" height="90" rx="8" fill="#F4E8E3" stroke="#1F3F30" stroke-width="2.5" />
        <path d="M40 30 C 50 25, 70 25, 80 30 L 80 95 L 40 95 Z" fill="#FCFAF7" opacity="0.6" />
        <circle cx="60" cy="55" r="16" fill="#F6EFE2" />
        <ellipse cx="60" cy="55" rx="10" ry="12" fill="#E9B862" stroke="#1F3F30" stroke-width="1.5" />
        <path d="M60 43 L 56 36 M60 43 L 64 36" stroke="#1F3F30" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    `
  },
  {
    id: "p6",
    name: "Pastel Ceramic Hanging Pot",
    price: 499.00,
    category: "Essentials",
    subcategory: "Pots",
    rating: 4.6,
    reviews: 43,
    badge: "Handmade",
    description: "Handmade pastel green ceramic hanging planter pot. Equipped with natural jute hanging ropes and drainage plugs.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <path d="M30 40 L90 40 C90 40 85 85 60 85 C35 85 30 40 30 40 Z" fill="#E1EFE6" stroke="#1F3F30" stroke-width="2.5" />
        <line x1="30" y1="40" x2="60" y2="10" stroke="#1F3F30" stroke-width="1.5" />
        <line x1="90" y1="40" x2="60" y2="10" stroke="#1F3F30" stroke-width="1.5" />
        <circle cx="60" cy="10" r="3" fill="#1F3F30" />
        <ellipse cx="60" cy="55" rx="15" ry="4" fill="#BAD9C7" opacity="0.5" />
      </svg>
    `
  },
  {
    id: "p7",
    name: "Crimson Velvet Rose Seeds",
    price: 179.00,
    category: "Seeds",
    subcategory: "Flowers",
    rating: 4.8,
    reviews: 82,
    badge: "Rare",
    description: "Rare deep velvet crimson rose seeds. Striking red blooms to bring gothic elegance and deep color to your borders.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_SOWING"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <rect x="25" y="15" width="70" height="90" rx="8" fill="#F4E8E3" stroke="#1F3F30" stroke-width="2.5" />
        <circle cx="60" cy="55" r="18" fill="#D06B62" />
        <path d="M60 37 C 50 45, 70 50, 60 73" stroke="#1F3F30" stroke-width="2" fill="none" />
        <circle cx="60" cy="55" r="8" fill="#F6EFE2" opacity="0.3" />
      </svg>
    `
  },
  {
    id: "p8",
    name: "Bird of Paradise Plant",
    price: 1499.00,
    category: "Plants",
    subcategory: "Live Plants",
    rating: 4.9,
    reviews: 110,
    badge: "Statement",
    description: "Beautiful tropical Strelitzia Bird of Paradise live indoor statement plant. Large paddle-shaped leaves bring lush jungle vibes.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <path d="M42 98 L78 98 L83 80 L37 80 Z" fill="#E3ECEF" stroke="#1F3F30" stroke-width="2" />
        <path d="M60 80 C60 50, 40 40, 40 15 C 60 30, 60 50, 60 80" fill="#BAD9C7" stroke="#1F3F30" stroke-width="2" />
        <path d="M60 80 C60 55, 80 45, 80 20 C 70 35, 68 55, 60 80" fill="#BAD9C7" stroke="#1F3F30" stroke-width="2" />
      </svg>
    `
  },
  {
    id: "p9",
    name: "Organic Liquid Kelp Fertilizer",
    price: 399.00,
    category: "Essentials",
    subcategory: "Soils",
    rating: 5.0,
    reviews: 55,
    badge: "Superfood",
    description: "Premium cold-processed liquid kelp seaweed fertilizer concentrate. Promotes robust root development and overall plant vitality.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <rect x="35" y="30" width="50" height="70" rx="6" fill="#F6EFE2" stroke="#1F3F30" stroke-width="2.5" />
        <rect x="48" y="15" width="24" height="15" rx="3" fill="#A8BEB1" stroke="#1F3F30" stroke-width="2" />
        <path d="M50 55 Q 60 45 60 75 T 70 65" stroke="#1F3F30" stroke-width="2" fill="none" />
      </svg>
    `
  },
  {
    id: "p10",
    name: "Heirloom Wildflower Seed Mix",
    price: 249.00,
    category: "Seeds",
    subcategory: "Flowers",
    rating: 4.7,
    reviews: 140,
    badge: "Pollinator Friendly",
    description: "Pollinator friendly heirloom wildflower seed mix. Perfect for establishing a natural bee and butterfly sanctuary in your yard.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_SOWING"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <rect x="25" y="15" width="70" height="90" rx="8" fill="#F4E8E3" stroke="#1F3F30" stroke-width="2.5" />
        <circle cx="48" cy="45" r="8" fill="#E9B862" opacity="0.7" />
        <circle cx="72" cy="55" r="10" fill="#A7D0B7" opacity="0.7" />
        <circle cx="56" cy="72" r="9" fill="#D06B62" opacity="0.7" />
      </svg>
    `
  },
  {
    id: "p11",
    name: "Garden Herbs Starter Kit",
    price: 449.00,
    category: "Seeds",
    subcategory: "Vegetables",
    rating: 4.8,
    reviews: 215,
    badge: "Top Seller",
    description: "Complete garden culinary herbs seed starter kit. Includes sweet basil, cilantro, flat-leaf parsley, and chives to grow fresh kitchen spices.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <rect x="25" y="30" width="70" height="75" rx="6" fill="#F6EFE2" stroke="#1F3F30" stroke-width="2.5" />
        <rect x="35" y="15" width="10" height="15" fill="#BAD9C7" stroke="#1F3F30" stroke-width="1.5" />
        <rect x="55" y="15" width="10" height="15" fill="#BAD9C7" stroke="#1F3F30" stroke-width="1.5" />
        <rect x="75" y="15" width="10" height="15" fill="#BAD9C7" stroke="#1F3F30" stroke-width="1.5" />
      </svg>
    `
  },
  {
    id: "p12",
    name: "Swiss Cheese Monstera",
    price: 899.00,
    category: "Plants",
    subcategory: "Live Plants",
    rating: 4.9,
    reviews: 184,
    badge: "Trending",
    description: "Beautiful trending Monstera Adansonii Swiss Cheese indoor live plant. Fast-growing vining foliage with iconic natural leaf fenestrations.",
    galleryImages: ["SVG_MAIN", "SVG_DETAIL", "SVG_BOX"],
    imageSvg: `
      <svg class="product-art" viewBox="0 0 120 120">
        <path d="M42 98 L78 98 L83 80 L37 80 Z" fill="#D4DFD8" stroke="#1F3F30" stroke-width="2" />
        <path d="M60 80 C60 40, 20 40, 30 15 C45 10, 60 30, 60 80 Z" fill="#88B299" stroke="#1F3F30" stroke-width="2" />
        <circle cx="42" cy="35" r="4" fill="#FCFAF7" stroke="#1F3F30" stroke-width="1.5" />
        <circle cx="50" cy="50" r="5" fill="#FCFAF7" stroke="#1F3F30" stroke-width="1.5" />
      </svg>
    `
  }
];

// Export modules to window scope for page specific scripts
window.PRODUCTS_DB = PRODUCTS_DB;
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
  
  // Compute comma-separated list of item names and IDs
  let itemNames = '';
  let itemIds = '';
  if (ecommerceData.items && ecommerceData.items.length) {
    itemNames = ecommerceData.items.map(function(item) {
      return item.item_name || item.name;
    }).join(', ');
    
    itemIds = ecommerceData.items.map(function(item) {
      return item.item_id || item.id;
    }).join(', ');
  }
  
  // Create payload with both root and ecommerce properties
  const payload = {
    event: eventName,
    currency: ecommerceData.currency,
    value: ecommerceData.value,
    items: ecommerceData.items,
    item_names: itemNames,
    item_ids: itemIds,
    ...ecommerceData,
    ecommerce: ecommerceData
  };
  
  console.log(`[GA4/GTM Tracking] Pushing event "${eventName}":`, payload);
  window.dataLayer.push(payload);
};
