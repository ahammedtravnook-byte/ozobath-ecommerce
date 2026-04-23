<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div>
      <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">My Profile</h1>
      <p class="text-xs sm:text-sm text-gray-400 mt-1 font-medium italic">Manage your account details and avatar</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Avatar Card -->
      <div class="admin-card p-6 flex flex-col items-center text-center gap-4">
        <!-- Avatar Preview -->
        <div class="relative group">
          <div class="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <img v-if="avatarPreview || authStore.user?.avatar?.url" :src="avatarPreview || authStore.user?.avatar?.url" class="w-full h-full object-cover" />
            <span v-else class="text-5xl font-black text-white">{{ initials }}</span>
          </div>
          <!-- Upload overlay -->
          <label class="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center">
            <span class="text-white text-xs font-black uppercase tracking-widest">📷 Change</span>
            <input type="file" accept="image/*" class="hidden" @change="handleAvatarChange" :disabled="uploadingAvatar" />
          </label>
        </div>

        <div v-if="uploadingAvatar" class="flex items-center gap-2 text-blue-600 text-sm font-bold">
          <span class="animate-spin inline-block w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full"></span>
          Uploading...
        </div>

        <div>
          <p class="text-lg font-black text-gray-900">{{ authStore.user?.name }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ authStore.user?.email }}</p>
          <span class="inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
            :class="authStore.user?.role === 'superadmin' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'">
            {{ authStore.user?.role === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin' }}
          </span>
        </div>

        <div class="w-full pt-4 border-t border-gray-50">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Since</p>
          <p class="text-sm font-bold text-gray-700 mt-1">{{ memberSince }}</p>
        </div>
      </div>

      <!-- Profile Info Card -->
      <div class="lg:col-span-2 space-y-6">
        <div class="admin-card p-6">
          <h2 class="text-base font-black text-gray-900 mb-5">Personal Information</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                <input v-model="form.name" class="admin-input w-full" placeholder="Your full name" />
              </div>
              <div>
                <label class="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-widest">Phone</label>
                <input v-model="form.phone" class="admin-input w-full" placeholder="+91 XXXXXXXXXX" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-widest">Email Address</label>
              <div class="relative">
                <input :value="authStore.user?.email" disabled class="admin-input w-full pr-20 bg-gray-50 text-gray-400 cursor-not-allowed" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">READ ONLY</span>
              </div>
              <p class="text-xs text-gray-400 mt-1">Email cannot be changed. Contact super admin if needed.</p>
            </div>

            <div class="flex justify-end pt-2">
              <button
                @click="saveProfile"
                :disabled="saving"
                class="px-8 py-3 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/10"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Account Info Card -->
        <div class="admin-card p-6">
          <h2 class="text-base font-black text-gray-900 mb-4">Account Details</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-gray-50/70 rounded-2xl p-4 text-center">
              <p class="text-2xl font-black text-gray-900">{{ authStore.user?.role === 'superadmin' ? '👑' : '🛡️' }}</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Role</p>
              <p class="text-xs font-bold text-gray-700 mt-0.5 capitalize">{{ authStore.user?.role }}</p>
            </div>
            <div class="bg-gray-50/70 rounded-2xl p-4 text-center">
              <p class="text-2xl font-black text-green-500">✓</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Status</p>
              <p class="text-xs font-bold text-green-600 mt-0.5">Active</p>
            </div>
            <div class="bg-gray-50/70 rounded-2xl p-4 text-center">
              <p class="text-2xl font-black text-blue-500">📅</p>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Joined</p>
              <p class="text-xs font-bold text-gray-700 mt-0.5">{{ memberSince }}</p>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="admin-card p-6 border border-red-100">
          <h2 class="text-base font-black text-red-600 mb-3">Danger Zone</h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-gray-900">Sign out of admin panel</p>
              <p class="text-xs text-gray-400 mt-0.5">You will need to log in again to access the admin panel</p>
            </div>
            <button @click="handleLogout" class="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { authAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

const saving = ref(false);
const uploadingAvatar = ref(false);
const avatarPreview = ref(null);

const form = ref({
  name: authStore.user?.name || '',
  phone: authStore.user?.phone || '',
});

const initials = computed(() => {
  const name = authStore.user?.name || '';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';
});

const memberSince = computed(() => {
  const date = authStore.user?.createdAt;
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
});

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Preview
  avatarPreview.value = URL.createObjectURL(file);

  try {
    uploadingAvatar.value = true;
    const res = await uploadAPI.uploadImage(file);
    const { url, publicId } = res.data;

    // Update profile with new avatar
    await authAPI.updateProfile({ avatar: { url, publicId } });
    authStore.updateUser({ avatar: { url, publicId } });
    toast.success('Profile picture updated!');
  } catch (e) {
    toast.error(e?.message || 'Failed to upload image');
    avatarPreview.value = null;
  } finally {
    uploadingAvatar.value = false;
  }
};

const saveProfile = async () => {
  if (!form.value.name.trim()) { toast.error('Name is required'); return; }
  try {
    saving.value = true;
    await authAPI.updateProfile({ name: form.value.name, phone: form.value.phone });
    authStore.updateUser({ name: form.value.name, phone: form.value.phone });
    toast.success('Profile updated successfully!');
  } catch (e) {
    toast.error(e?.message || 'Failed to update profile');
  } finally {
    saving.value = false;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  form.value = {
    name: authStore.user?.name || '',
    phone: authStore.user?.phone || '',
  };
});
</script>
