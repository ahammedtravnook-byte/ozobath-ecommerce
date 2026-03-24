// ============================================
// OZOBATH - Admin API Services
// ============================================
import api from './axiosInstance';

// ─── Auth ────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

// ─── Dashboard & Analytics ──────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSalesReport: (period) => api.get('/analytics/sales', { params: { period } }),
  getCustomers: () => api.get('/analytics/customers'),
};

// ─── Products ────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products/admin/all', { params }),
  getById: (id) => api.get(`/products/admin/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ─── Categories ──────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories/admin/all'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Orders ──────────────────────────────────────
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// ─── Dynamic Content ────────────────────────────
export const contentAPI = {
  getAll: (params) => api.get('/content', { params }),
  create: (data) => api.post('/content', data),
  update: (id, data) => api.put(`/content/${id}`, data),
  delete: (id) => api.delete(`/content/${id}`),
  reorder: (page, sections) => api.put(`/content/reorder/${page}`, { sections }),
};

// ─── Banners ─────────────────────────────────────
export const bannerAPI = {
  getAll: () => api.get('/banners/admin/all'),
  create: (data) => api.post('/banners', data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  delete: (id) => api.delete(`/banners/${id}`),
};

// ─── Blogs ───────────────────────────────────────
export const blogAPI = {
  getAll: () => api.get('/blogs/admin/all'),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
};

// ─── Reviews ─────────────────────────────────────
export const reviewAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  approve: (id, isApproved) => api.put(`/reviews/${id}/approve`, { isApproved }),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ─── Coupons ─────────────────────────────────────
export const couponAPI = {
  getAll: () => api.get('/coupons'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// ─── FAQs ────────────────────────────────────────
export const faqAPI = {
  getAll: () => api.get('/faqs'),
  create: (data) => api.post('/faqs', data),
  update: (id, data) => api.put(`/faqs/${id}`, data),
  delete: (id) => api.delete(`/faqs/${id}`),
};

// ─── Testimonials ────────────────────────────────
export const testimonialAPI = {
  getAll: () => api.get('/testimonials'),
  create: (data) => api.post('/testimonials', data),
  update: (id, data) => api.put(`/testimonials/${id}`, data),
  delete: (id) => api.delete(`/testimonials/${id}`),
};

// ─── Enquiries ───────────────────────────────────
export const enquiryAPI = {
  getAll: (params) => api.get('/enquiries/b2b', { params }),
  update: (id, data) => api.put(`/enquiries/b2b/${id}`, data),
};

// ─── Service Requests ────────────────────────────
export const serviceRequestAPI = {
  getAll: (params) => api.get('/service-requests', { params }),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
};

// ─── Bookings ────────────────────────────────────
export const bookingAPI = {
  getVideoCallBookings: () => api.get('/bookings/video-call'),
  createSlot: (data) => api.post('/bookings/video-call/create-slot', data),
  updateSlot: (id, data) => api.put(`/bookings/video-call/${id}`, data),
  getSiteVisits: () => api.get('/bookings/site-visit'),
  updateSiteVisit: (id, data) => api.put(`/bookings/site-visit/${id}`, data),
};

// ─── Newsletter ──────────────────────────────────
export const newsletterAPI = {
  getSubscribers: () => api.get('/newsletter/subscribers'),
};

// ─── Upload ──────────────────────────────────────
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return api.post('/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (publicId) => api.delete(`/upload/image/${publicId}`),
};

// ─── Admin Users (SuperAdmin) ────────────────────
export const adminUserAPI = {
  getAll: () => api.get('/admin/users'),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
};
