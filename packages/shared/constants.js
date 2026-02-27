// ============================================
// OZOBATH Shared Constants
// ============================================

const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  CUSTOMER: 'customer',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const CONTENT_PAGES = {
  HOME: 'home',
  ABOUT: 'about',
  CONTACT: 'contact',
  SHOP: 'shop',
  FAQ: 'faq',
  EXPERIENCE: 'experience',
};

const CONTENT_SECTIONS = {
  ANNOUNCEMENT_BAR: 'announcement_bar',
  HERO_BANNER: 'hero_banner',
  CATEGORY_TILES: 'category_tiles',
  BEST_SELLERS: 'best_sellers',
  NEW_ARRIVALS: 'new_arrivals',
  TRUST_BADGES: 'trust_badges',
  VIDEO_SECTION: 'video_section',
  TESTIMONIALS: 'testimonials',
  GOOGLE_REVIEWS: 'google_reviews',
  INSTAGRAM_FEED: 'instagram_feed',
  BLOG_HIGHLIGHTS: 'blog_highlights',
  NEWSLETTER: 'newsletter',
  PARTNER_LOGOS: 'partner_logos',
  FAQ_SECTION: 'faq_section',
  PAGE_HEADER: 'page_header',
  PAGE_CONTENT: 'page_content',
};

const PRODUCT_BADGES = {
  BEST_SELLER: 'best-seller',
  NEW: 'new',
  FEATURED: 'featured',
  SALE: 'sale',
  LIMITED: 'limited',
};

const BANNER_POSITIONS = {
  HERO: 'hero',
  PROMO: 'promo',
  CATEGORY: 'category',
  SIDEBAR: 'sidebar',
};

module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  BOOKING_STATUS,
  CONTENT_PAGES,
  CONTENT_SECTIONS,
  PRODUCT_BADGES,
  BANNER_POSITIONS,
};
