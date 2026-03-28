<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-64 bg-sidebar-bg text-white transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-sidebar-border">
        <h1 class="text-xl font-extrabold tracking-tight">
          OZO<span class="text-blue-400">BATH</span>
          <span class="text-xs font-normal text-gray-400 ml-2">Admin</span>
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        <template v-for="group in menuGroups" :key="group.label">
          <p class="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {{ group.label }}
          </p>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              $route.path === item.path
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
            ]"
          >
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </router-link>
        </template>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 lg:ml-64">
      <!-- Top Bar -->
      <header class="sticky top-0 z-20 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm">
        <button
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <span class="text-xl">☰</span>
        </button>

        <div class="flex items-center gap-4 ml-auto">
          <!-- Pending Alerts -->
          <div v-if="!alertsLoading && (pendingOrders > 0 || lowStockCount > 0)" class="flex items-center gap-2">
            <!-- Pending Orders alert -->
            <router-link
              v-if="pendingOrders > 0"
              to="/orders"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
              title="Pending Orders"
            >
              <span class="text-xs">🛒</span>
              <span class="text-xs font-semibold">{{ pendingOrders }} pending</span>
            </router-link>

            <!-- Low Stock alert -->
            <router-link
              v-if="lowStockCount > 0"
              to="/inventory"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              title="Low Stock Products"
            >
              <span class="text-xs">⚠️</span>
              <span class="text-xs font-semibold">{{ lowStockCount }} low stock</span>
            </router-link>
          </div>

          <span class="text-sm text-gray-500">
            {{ authStore.user?.name || 'Admin' }}
          </span>
          <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {{ (authStore.user?.name || 'A').charAt(0).toUpperCase() }}
          </div>
          <button
            @click="handleLogout"
            class="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <router-view />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-20 lg:hidden"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { analyticsAPI } from '@/api/services';

const sidebarOpen = ref(false);
const router = useRouter();
const authStore = useAuthStore();

// Pending alerts state
const pendingOrders = ref(0);
const lowStockCount = ref(0);
const alertsLoading = ref(true);

const fetchAlerts = async () => {
  try {
    alertsLoading.value = true;
    const res = await analyticsAPI.getDashboard();
    const stats = res.data?.stats || res.stats || {};
    pendingOrders.value = stats.pendingOrders ?? 0;
    lowStockCount.value = stats.lowStockCount ?? stats.lowStock ?? 0;
  } catch (e) {
    // Silently fail — alerts are non-critical
    pendingOrders.value = 0;
    lowStockCount.value = 0;
  } finally {
    alertsLoading.value = false;
  }
};

const menuGroups = computed(() => {
  const groups = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', path: '/', icon: '📊' },
      ],
    },
    {
      label: 'Catalog',
      items: [
        { label: 'Products', path: '/products', icon: '📦' },
        { label: 'Categories', path: '/categories', icon: '🏷️' },
        { label: 'Inventory', path: '/inventory', icon: '📋' },
      ],
    },
    {
      label: 'Sales',
      items: [
        { label: 'Orders', path: '/orders', icon: '🛒' },
        { label: 'Customers', path: '/customers', icon: '👥' },
        { label: 'Coupons', path: '/coupons', icon: '🎟️' },
        { label: 'Reports', path: '/reports', icon: '📈' },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Banners', path: '/banners', icon: '🖼️' },
        { label: 'Blogs', path: '/blogs', icon: '📝' },
        { label: 'FAQs', path: '/faqs', icon: '❓' },
        { label: 'Testimonials', path: '/testimonials', icon: '⭐' },
        { label: 'Reviews', path: '/reviews', icon: '💬' },
      ],
    },
    {
      label: 'Bookings',
      items: [
        { label: 'Video Call Slots', path: '/bookings', icon: '📹' },
        { label: 'B2B Enquiries', path: '/enquiries', icon: '🏢' },
        { label: 'Service Requests', path: '/service-requests', icon: '🔧' },
        { label: 'Experience Centres', path: '/experience-centres', icon: '📍' },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { label: 'Newsletter', path: '/newsletter', icon: '📧' },
      ],
    },
  ];

  if (authStore.isSuperAdmin) {
    groups.push({
      label: 'Administration',
      items: [
        { label: 'Admin Users', path: '/admin-users', icon: '🔐' },
        { label: 'Settings', path: '/settings', icon: '⚙️' },
      ],
    });
  }

  return groups;
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(fetchAlerts);
</script>
