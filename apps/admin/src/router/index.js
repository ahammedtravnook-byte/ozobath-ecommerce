import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

// Layout
import AdminLayout from '@/components/layout/AdminLayout.vue';

// Views
const LoginView = () => import('@/views/LoginView.vue');
const DashboardView = () => import('@/views/DashboardView.vue');
const ProductsView = () => import('@/views/ProductsView.vue');
const ProductFormView = () => import('@/views/ProductFormView.vue');
const CategoriesView = () => import('@/views/CategoriesView.vue');
const OrdersView = () => import('@/views/OrdersView.vue');
const OrderDetailView = () => import('@/views/OrderDetailView.vue');
const CustomersView = () => import('@/views/CustomersView.vue');
const CouponsView = () => import('@/views/CouponsView.vue');
const BannersView = () => import('@/views/BannersView.vue');
const ContentManagerView = () => import('@/views/ContentManagerView.vue');
const BlogsView = () => import('@/views/BlogsView.vue');
const BlogFormView = () => import('@/views/BlogFormView.vue');
const ReviewsView = () => import('@/views/ReviewsView.vue');
const FAQsView = () => import('@/views/FAQsView.vue');
const TestimonialsView = () => import('@/views/TestimonialsView.vue');
const ExperienceCentresView = () => import('@/views/ExperienceCentresView.vue');
const BookingsView = () => import('@/views/BookingsView.vue');
const EnquiriesView = () => import('@/views/EnquiriesView.vue');
const ServiceRequestsView = () => import('@/views/ServiceRequestsView.vue');
const NewsletterView = () => import('@/views/NewsletterView.vue');
const InventoryView = () => import('@/views/InventoryView.vue');
const ReportsView = () => import('@/views/ReportsView.vue');
const AdminUsersView = () => import('@/views/AdminUsersView.vue');
const SettingsView = () => import('@/views/SettingsView.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: DashboardView },
      { path: 'products', name: 'Products', component: ProductsView },
      { path: 'products/new', name: 'NewProduct', component: ProductFormView },
      { path: 'products/:id/edit', name: 'EditProduct', component: ProductFormView },
      { path: 'categories', name: 'Categories', component: CategoriesView },
      { path: 'orders', name: 'Orders', component: OrdersView },
      { path: 'orders/:id', name: 'OrderDetail', component: OrderDetailView },
      { path: 'customers', name: 'Customers', component: CustomersView },
      { path: 'coupons', name: 'Coupons', component: CouponsView },
      { path: 'banners', name: 'Banners', component: BannersView },
      { path: 'content', name: 'ContentManager', component: ContentManagerView },
      { path: 'blogs', name: 'Blogs', component: BlogsView },
      { path: 'blogs/new', name: 'NewBlog', component: BlogFormView },
      { path: 'blogs/:id/edit', name: 'EditBlog', component: BlogFormView },
      { path: 'reviews', name: 'Reviews', component: ReviewsView },
      { path: 'faqs', name: 'FAQs', component: FAQsView },
      { path: 'testimonials', name: 'Testimonials', component: TestimonialsView },
      { path: 'experience-centres', name: 'ExperienceCentres', component: ExperienceCentresView },
      { path: 'bookings', name: 'Bookings', component: BookingsView },
      { path: 'enquiries', name: 'Enquiries', component: EnquiriesView },
      { path: 'service-requests', name: 'ServiceRequests', component: ServiceRequestsView },
      { path: 'newsletter', name: 'Newsletter', component: NewsletterView },
      { path: 'inventory', name: 'Inventory', component: InventoryView },
      { path: 'reports', name: 'Reports', component: ReportsView },
      { path: 'admin-users', name: 'AdminUsers', component: AdminUsersView, meta: { requiresSuperAdmin: true } },
      { path: 'settings', name: 'Settings', component: SettingsView },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else if (to.meta.requiresSuperAdmin && authStore.user?.role !== 'superadmin') {
    next('/');
  } else {
    next();
  }
});

export default router;
