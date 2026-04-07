<template>
  <div class="min-h-screen flex bg-[#F8FAFC]">
    <!-- Mobile Sidebar Backdrop -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[40] lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-[50] w-72 bg-[#0F172A] text-white transition-all duration-500 ease-[0.16,1,0.3,1] lg:translate-x-0 border-r border-white/5',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Brand Logo -->
      <div class="h-20 flex items-center px-8 border-b border-white/5 bg-[#0F172A]/50 backdrop-blur-md sticky top-0 z-10">
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
            <img src="/images/logo.png" alt="OZO" class="w-full h-full object-contain" />
          </div>
          <div>
            <h1 class="text-lg font-black tracking-tight leading-none">
              OZO<span class="text-blue-400">BATH</span>
            </h1>
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Control Panel</span>
          </div>
        </router-link>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 px-4 pb-10 space-y-1.5 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
        <template v-for="group in menuGroups" :key="group.label">
          <div class="px-4 pt-6 pb-2">
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] opacity-80">{{ group.label }}</span>
          </div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            @click="sidebarOpen = false"
            :class="[
              'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-300 group relative overflow-hidden',
              $route.path === item.path
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            ]"
          >
            <span :class="['text-xl transition-transform duration-300 group-hover:scale-110', $route.path === item.path ? 'scale-110' : '']">
              {{ item.icon }}
            </span>
            <span class="flex-1">{{ item.label }}</span>
            <div 
              v-if="$route.path === item.path"
              class="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"
            />
          </router-link>
        </template>
      </nav>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 lg:ml-72 flex flex-col min-w-0">
      <!-- Enhanced Top Bar -->
      <header class="sticky top-0 z-[30] h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8">
        <div class="flex items-center gap-4">
          <button
            class="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all text-gray-600"
            @click="sidebarOpen = !sidebarOpen"
          >
            <span class="text-2xl" v-if="!sidebarOpen">☰</span>
            <span class="text-2xl" v-else>✕</span>
          </button>
          
          <div class="hidden md:block">
            <h2 class="text-sm font-bold text-gray-900 tracking-tight">{{ currentPathLabel }}</h2>
            <p class="text-[11px] text-gray-400 font-medium">Welcome back, {{ authStore.user?.name || 'Admin' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Pending Status Pills (Optimized for Mobile) -->
          <div v-if="!alertsLoading" class="hidden sm:flex items-center gap-2">
            <router-link
              v-if="pendingOrders > 0"
              to="/orders"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-all"
            >
              <span class="text-xs">🛒</span>
              <span class="text-[11px] font-bold uppercase tracking-wider">{{ pendingOrders }}</span>
            </router-link>
            <router-link
              v-if="lowStockCount > 0"
              to="/inventory"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-all"
            >
              <span class="text-xs">⚠️</span>
              <span class="text-[11px] font-bold uppercase tracking-wider">{{ lowStockCount }}</span>
            </router-link>
          </div>

          <!-- Divider -->
          <div class="hidden sm:block w-px h-6 bg-gray-100 mx-1" />

          <!-- Notification Center -->
          <div class="relative" ref="notifDropdownRef">
            <button
              @click="toggleNotifications"
              class="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all group"
            >
              <span class="text-xl group-hover:scale-110 transition-transform">🔔</span>
              <span
                v-if="notifUnreadCount > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              >
                {{ notifUnreadCount > 9 ? '9+' : notifUnreadCount }}
              </span>
            </button>

            <!-- Modern Dropdown -->
            <Transition name="slide-down">
              <div
                v-if="notifOpen"
                class="fixed sm:absolute inset-x-4 sm:inset-auto sm:right-0 top-24 sm:top-full sm:mt-3 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
              >
                <div class="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="text-xl">🔔</span>
                      <h3 class="text-sm font-black text-white uppercase tracking-widest">Inbox</h3>
                    </div>
                    <button
                      v-if="notifUnreadCount > 0"
                      @click="markAllNotificationsRead"
                      class="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div class="max-h-[60vh] overflow-y-auto bg-gray-50/50">
                  <div v-if="notifLoading" class="flex items-center justify-center py-12">
                    <div class="w-8 h-8 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">🔕</div>
                    <p class="text-sm font-bold text-gray-900">All caught up!</p>
                    <p class="text-[11px] text-gray-400 mt-1 font-medium">No new notifications at the moment.</p>
                  </div>
                  <div v-else class="divide-y divide-gray-50">
                    <div
                      v-for="notif in notifications"
                      :key="notif._id"
                      @click="handleNotifClick(notif)"
                      :class="[
                        'flex items-start gap-4 px-6 py-4 transition-all duration-300 hover:bg-blue-50/30',
                        !isNotifRead(notif) ? 'bg-blue-50/20' : ''
                      ]"
                    >
                      <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm', !isNotifRead(notif) ? 'bg-white ring-2 ring-blue-100' : 'bg-gray-100']">
                        {{ getNotifIcon(notif.type) }}
                      </div>
                      <div class="flex-1 min-w-0 pt-0.5">
                        <p :class="['text-xs font-bold leading-tight', !isNotifRead(notif) ? 'text-gray-900' : 'text-gray-500']">
                          {{ notif.title }}
                        </p>
                        <p class="text-[11px] text-gray-400 mt-1 font-medium leading-relaxed line-clamp-2">{{ notif.message }}</p>
                        <p class="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-2">{{ formatNotifTime(notif.createdAt) }}</p>
                      </div>
                      <div v-if="!isNotifRead(notif)" class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- User Profile -->
          <div class="flex items-center gap-2 group cursor-pointer" @click="$router.push('/profile')">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform border-4 border-white">
              {{ (authStore.user?.name || 'A').charAt(0).toUpperCase() }}
            </div>
            <div class="hidden xl:block">
              <p class="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">{{ authStore.user?.name || 'Admin' }}</p>
              <p class="text-[10px] text-emerald-500 font-bold mt-1 leading-none">Super Admin</p>
            </div>
          </div>

          <button
            @click="handleLogout"
            class="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500 border border-red-50 transition-colors"
            title="Sign Out"
          >
            <span class="text-xl">🚪</span>
          </button>
        </div>
      </header>

      <!-- Dynamic Page Content -->
      <main class="p-4 sm:p-8 flex-1 animate-fade-in relative overflow-x-hidden">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
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

const currentPathLabel = computed(() => {
  const path = router.currentRoute.value.path;
  for (const group of menuGroups.value) {
    const item = group.items.find(i => i.path === path);
    if (item) return item.label;
  }
  return 'Dashboard';
});

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
    {
      label: 'Monitoring',
      items: [
        { label: 'Activity Logs', path: '/activity-logs', icon: '🗂️' },
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

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Page Transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Slide Down Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
