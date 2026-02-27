// ============================================
// OZOBATH - Client API Services
// ============================================
import api from './axiosInstance';

// ─── Auth API ────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

// ─── Product API ─────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
};

// ─── Category API ────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
};

// ─── Cart API ────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (data) => api.put('/cart/update', data),
  remove: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clear: () => api.delete('/cart/clear'),
};

// ─── Wishlist API ────────────────────────────────
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist/add', { productId }),
  remove: (productId) => api.delete(`/wishlist/remove/${productId}`),
};

// ─── Order API ───────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getMyOrder: (id) => api.get(`/orders/my-orders/${id}`),
};

// ─── Content API (Dynamic CMS) ──────────────────
export const contentAPI = {
  getPageContent: (page) => api.get(`/content/${page}`),
};

// ─── Banner API ──────────────────────────────────
export const bannerAPI = {
  get: (params) => api.get('/banners', { params }),
};

// ─── Blog API ────────────────────────────────────
export const blogAPI = {
  getAll: (params) => api.get('/blogs', { params }),
  getBySlug: (slug) => api.get(`/blogs/${slug}`),
};

// ─── Review API ──────────────────────────────────
export const reviewAPI = {
  getForProduct: (productId) => api.get(`/reviews/product/${productId}`),
  create: (data) => api.post('/reviews', data),
};

// ─── FAQ API ─────────────────────────────────────
export const faqAPI = {
  getAll: () => api.get('/faqs'),
};

// ─── Testimonial API ─────────────────────────────
export const testimonialAPI = {
  getAll: () => api.get('/testimonials'),
};

// ─── Coupon API ──────────────────────────────────
export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
};

// ─── Newsletter API ──────────────────────────────
export const newsletterAPI = {
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
};

// ─── Enquiry API ─────────────────────────────────
export const enquiryAPI = {
  submitB2B: (data) => api.post('/enquiries/b2b', data),
};

// ─── Service API ─────────────────────────────────
export const serviceAPI = {
  submit: (data) => api.post('/service-requests', data),
};

// ─── Booking API ─────────────────────────────────
export const bookingAPI = {
  getAvailableSlots: (date) => api.get('/bookings/video-call/available', { params: { date } }),
  bookVideoCall: (data) => api.post('/bookings/video-call', data),
  bookSiteVisit: (data) => api.post('/bookings/site-visit', data),
};

// ─── Payment API ─────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verify: (data) => api.post('/payment/verify', data),
};
