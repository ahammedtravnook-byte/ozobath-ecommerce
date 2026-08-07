// ============================================
// OZOBATH - Admin API Services
// ============================================
import api from './axiosInstance';

// ─── Auth ────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

// ─── Dashboard & Analytics ──────────────────────
export const analyticsAPI = {
  // params carries the date range; config carries the AbortController signal.
  getDashboard: (params, config) => api.get('/analytics/dashboard', { params, ...config }),
  getSalesReport: (period) => api.get('/analytics/sales', { params: { period } }),
  // config carries the AbortController signal from useDataTable, so a
  // superseded request is cancelled instead of racing the newer one.
  getCustomers: (params, config) => api.get('/analytics/customers', { params, ...config }),
};

// ─── Products ────────────────────────────────────
export const productAPI = {
  getAll: (params, config) => api.get('/products/admin/all', { params, ...config }),
  getStockSummary: (config) => api.get('/products/admin/stock-summary', { ...config }),
  getById: (id) => api.get(`/products/admin/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkUpload: (file) => {
    const formData = new FormData();
    formData.append('excel', file);
    return api.post('/products/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadTemplate: () => api.get('/products/bulk-upload/template', { responseType: 'blob' }),
};

// ─── Categories ──────────────────────────────────
export const categoryAPI = {
  getAll: (params, config) => api.get('/categories/admin/all', { params, ...config }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Orders ──────────────────────────────────────
export const orderAPI = {
  getAll: (params, config) => api.get('/orders', { params, ...config }),
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

// ─── Video Tours ─────────────────────────────────
export const videoTourAPI = {
  getAll: () => api.get('/video-tours/admin/all'),
  create: (data) => api.post('/video-tours', data),
  update: (id, data) => api.put(`/video-tours/${id}`, data),
  delete: (id) => api.delete(`/video-tours/${id}`),
  reorder: (orders) => api.patch('/video-tours/reorder', { orders }),
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
  getAll: (params) => api.get('/reviews/admin/all', { params }),
  approve: (id, isApproved) => api.put(`/reviews/admin/${id}`, { isApproved }),
  delete: (id) => api.delete(`/reviews/admin/${id}`),
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
  getAll: (params, config) => api.get('/enquiries/b2b', { params, ...config }),
  update: (id, data) => api.put(`/enquiries/b2b/${id}`, data),
};

// ─── Service Requests ────────────────────────────
export const serviceRequestAPI = {
  getAll: (params) => api.get('/service-requests', { params }),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
};

// ─── Bookings ────────────────────────────────────
export const bookingAPI = {
  getAllSlots: (date) => api.get('/bookings/video-call/all', { params: date ? { date } : {} }),
  getVideoCallBookings: () => api.get('/bookings/video-call'),
  createSlot: (data) => api.post('/bookings/video-call/create-slot', data),
  createBulkSlots: (data) => api.post('/bookings/video-call/create-bulk', data),
  updateSlot: (id, data) => api.put(`/bookings/video-call/${id}`, data),
  deleteSlot: (id) => api.delete(`/bookings/video-call/${id}`),
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

// ─── Admin Notifications ─────────────────────────
export const adminNotificationAPI = {
  getAll: (limit = 30) => api.get('/admin-notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/admin-notifications/unread-count'),
  markAsRead: (id) => api.put(`/admin-notifications/${id}/read`),
  markAllRead: () => api.put('/admin-notifications/mark-all-read'),
};

// ─── Admin Users (SuperAdmin) ────────────────────
export const adminUserAPI = {
  getAll: () => api.get('/admin/users'),
  create: (data) => api.post('/admin/users', data),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
};

export const activityLogAPI = {
  getAll: (params) => api.get('/activity-logs', { params }),
};
