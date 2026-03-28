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

        <div class="flex items-center gap-3 ml-auto">
          <!-- Pending Alerts -->
          <div v-if="!alertsLoading && (pendingOrders > 0 || lowStockCount > 0)" class="flex items-center gap-2">
            <router-link
              v-if="pendingOrders > 0"
              to="/orders"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              <span class="text-xs">🛒</span>
              <span class="text-xs font-semibold">{{ pendingOrders }} pending</span>
            </router-link>
            <router-link
              v-if="lowStockCount > 0"
              to="/inventory"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <span class="text-xs">⚠️</span>
              <span class="text-xs font-semibold">{{ lowStockCount }} low stock</span>
            </router-link>
          </div>

          <!-- Notification Bell -->
          <div class="relative" ref="notifDropdownRef">
            <button
              @click="toggleNotifications"
              class="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <span class="text-xl leading-none">🔔</span>
              <span
                v-if="notifUnreadCount > 0"
                class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {{ notifUnreadCount > 9 ? '9+' : notifUnreadCount }}
              </span>
            </button>

            <!-- Dropdown -->
            <Transition name="notif-dropdown">
              <div
                v-if="notifOpen"
                class="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
              >
                <!-- Header -->
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-gray-900">Notifications</h3>
                    <span v-if="notifUnreadCount > 0" class="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                      {{ notifUnreadCount }} new
                    </span>
                  </div>
                  <button
                    v-if="notifUnreadCount > 0"
                    @click="markAllNotificationsRead"
                    class="text-[11px] text-blue-500 font-semibold hover:text-blue-600"
                  >
                    Mark all read
                  </button>
                </div>

                <!-- List -->
                <div class="max-h-80 overflow-y-auto">
                  <div v-if="notifLoading" class="flex items-center justify-center py-8">
                    <div class="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <div v-else-if="notifications.length === 0" class="text-center py-10 px-4">
                    <p class="text-2xl mb-2">🔔</p>
                    <p class="text-sm text-gray-400">No notifications yet</p>
                  </div>
                  <div v-else>
                    <div
                      v-for="notif in notifications"
                      :key="notif._id"
                      @click="handleNotifClick(notif)"
                      :class="[
                        'flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors',
                        notif.link ? 'cursor-pointer hover:bg-blue-50/60' : 'cursor-default hover:bg-gray-50',
                        !isNotifRead(notif) ? 'bg-blue-50/30' : ''
                      ]"
                    >
                      <span class="text-lg shrink-0 mt-0.5">{{ getNotifIcon(notif.type) }}</span>
                      <div class="flex-1 min-w-0">
                        <p :class="['text-xs font-semibold truncate', !isNotifRead(notif) ? 'text-gray-900' : 'text-gray-500']">
                          {{ notif.title }}
                        </p>
                        <p class="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{{ notif.message }}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <p class="text-[10px] text-gray-300">{{ formatNotifTime(notif.createdAt) }}</p>
                          <p v-if="notif.link" class="text-[10px] text-blue-400 font-medium">Click to view →</p>
                        </div>
                      </div>
                      <div v-if="!isNotifRead(notif)" class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="w-px h-5 bg-gray-200" />

          <span class="text-sm text-gray-500 hidden sm:block">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { analyticsAPI, adminNotificationAPI } from '@/api/services';

const sidebarOpen = ref(false);
const router = useRouter();
const authStore = useAuthStore();

// ── Pending alerts ──────────────────────────────
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
  } catch {
    pendingOrders.value = 0;
    lowStockCount.value = 0;
  } finally {
    alertsLoading.value = false;
  }
};

// ── Admin Notifications ──────────────────────────
const notifOpen = ref(false);
const notifications = ref([]);
const notifUnreadCount = ref(0);
const notifLoading = ref(false);
const notifDropdownRef = ref(null);
let notifPollInterval = null;

const NOTIF_ICONS = {
  new_order: '🛒', new_review: '⭐', low_stock: '📉',
  new_enquiry: '🏢', new_service_request: '🔧', new_booking: '📹',
  payment_failed: '⚠️',
};
const getNotifIcon = (type) => NOTIF_ICONS[type] || '🔔';

const isNotifRead = (notif) =>
  notif.readBy?.some(id => id === authStore.user?._id || id?.toString() === authStore.user?._id?.toString());

const formatNotifTime = (date) => {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
};

const fetchNotifUnreadCount = async () => {
  try {
    const res = await adminNotificationAPI.getUnreadCount();
    notifUnreadCount.value = res.data?.count ?? 0;
  } catch { /* silent */ }
};

const fetchNotifications = async () => {
  try {
    notifLoading.value = true;
    const res = await adminNotificationAPI.getAll();
    notifications.value = res.data?.notifications || [];
    notifUnreadCount.value = res.data?.unreadCount ?? 0;
  } catch { /* silent */ } finally {
    notifLoading.value = false;
  }
};

const toggleNotifications = () => {
  notifOpen.value = !notifOpen.value;
  if (notifOpen.value) fetchNotifications();
};

const handleNotifClick = async (notif) => {
  if (!isNotifRead(notif)) {
    await adminNotificationAPI.markAsRead(notif._id).catch(() => {});
    // Optimistically mark read locally
    if (!notif.readBy) notif.readBy = [];
    notif.readBy.push(authStore.user?._id);
    notifUnreadCount.value = Math.max(0, notifUnreadCount.value - 1);
  }
  if (notif.link) {
    notifOpen.value = false;
    router.push(notif.link);
  }
};

const markAllNotificationsRead = async () => {
  await adminNotificationAPI.markAllRead().catch(() => {});
  notifications.value.forEach(n => {
    if (!n.readBy) n.readBy = [];
    if (!isNotifRead(n)) n.readBy.push(authStore.user?._id);
  });
  notifUnreadCount.value = 0;
};

// Close dropdown on outside click
const handleOutsideClick = (e) => {
  if (notifDropdownRef.value && !notifDropdownRef.value.contains(e.target)) {
    notifOpen.value = false;
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

onMounted(() => {
  fetchAlerts();
  fetchNotifUnreadCount();
  notifPollInterval = setInterval(fetchNotifUnreadCount, 30000);
  document.addEventListener('mousedown', handleOutsideClick);
});

onUnmounted(() => {
  clearInterval(notifPollInterval);
  document.removeEventListener('mousedown', handleOutsideClick);
});
</script>

<style scoped>
.notif-dropdown-enter-active,
.notif-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.notif-dropdown-enter-from,
.notif-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
