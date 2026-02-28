<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
    <div class="space-y-6">
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">General Information</h2>
        <div class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Site Name</label><input v-model="settings.siteName" class="admin-input w-full max-w-md" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Tagline</label><input v-model="settings.tagline" class="admin-input w-full max-w-md" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Support Email</label><input v-model="settings.supportEmail" type="email" class="admin-input w-full max-w-md" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Support Phone</label><input v-model="settings.supportPhone" class="admin-input w-full max-w-md" /></div>
        </div>
      </div>

      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Address</h2>
        <div class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label><input v-model="settings.address.line1" class="admin-input w-full max-w-md" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label><input v-model="settings.address.line2" class="admin-input w-full max-w-md" /></div>
          <div class="grid grid-cols-3 gap-4 max-w-md">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">City</label><input v-model="settings.address.city" class="admin-input w-full" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">State</label><input v-model="settings.address.state" class="admin-input w-full" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Pincode</label><input v-model="settings.address.pincode" class="admin-input w-full" /></div>
          </div>
        </div>
      </div>

      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Instagram</label><input v-model="settings.social.instagram" class="admin-input w-full" placeholder="https://..." /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Facebook</label><input v-model="settings.social.facebook" class="admin-input w-full" placeholder="https://..." /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">YouTube</label><input v-model="settings.social.youtube" class="admin-input w-full" placeholder="https://..." /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label><input v-model="settings.social.whatsapp" class="admin-input w-full" placeholder="+91..." /></div>
        </div>
      </div>

      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">SEO Defaults</h2>
        <div class="space-y-4 max-w-md">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Default Meta Title</label><input v-model="settings.seo.title" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Default Meta Description</label><textarea v-model="settings.seo.description" rows="3" class="admin-input w-full"></textarea></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Keywords</label><input v-model="settings.seo.keywords" class="admin-input w-full" placeholder="comma separated" /></div>
        </div>
      </div>

      <div class="flex justify-end">
        <button @click="saveSettings" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Settings' }}</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
const toast = useToast();
const saving = ref(false);
const settings = ref({
  siteName: 'OZOBATH', tagline: 'Premium Bath Solutions', supportEmail: 'info@ozobath.com', supportPhone: '+91 7899202927',
  address: { line1: '', line2: '', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  social: { instagram: '', facebook: '', youtube: '', whatsapp: '' },
  seo: { title: 'OZOBATH - Premium Bath Solutions', description: '', keywords: '' },
});

// Load from localStorage on mount
const saved = localStorage.getItem('ozobath_settings');
if (saved) { try { Object.assign(settings.value, JSON.parse(saved)); } catch(e) {} }

const saveSettings = async () => {
  saving.value = true;
  try {
    // Save to localStorage for now (can be moved to API later)
    localStorage.setItem('ozobath_settings', JSON.stringify(settings.value));
    toast.success('Settings saved');
  } catch (e) { toast.error('Failed to save'); }
  finally { saving.value = false; }
};
</script>
