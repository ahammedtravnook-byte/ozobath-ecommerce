<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Admin Users</h1>
      <button @click="openCreate" class="admin-btn-primary">+ Create Admin</button>
    </div>

    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>

      <table v-else-if="admins.length > 0" class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Name</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Email</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Role</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="admin in admins" :key="admin._id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ admin.name }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ admin.email }}</td>
            <td class="px-4 py-3">
              <span :class="admin.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ admin.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button v-if="admin.role !== 'superadmin'" @click="toggleStatus(admin._id)" :class="admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80">
                {{ admin.isActive ? 'Active' : 'Inactive' }}
              </button>
              <span v-else class="text-xs text-green-600 font-medium">Protected</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button v-if="admin.role !== 'superadmin'" @click="deleteAdmin(admin._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold mb-4">Create Admin Account</h2>
        <form @submit.prevent="createAdmin" class="space-y-4">
          <div><label class="admin-label">Name</label><input v-model="form.name" class="admin-input" required /></div>
          <div><label class="admin-label">Email</label><input v-model="form.email" type="email" class="admin-input" required /></div>
          <div><label class="admin-label">Phone</label><input v-model="form.phone" class="admin-input" /></div>
          <div><label class="admin-label">Password</label><input v-model="form.password" type="password" class="admin-input" required minlength="6" /></div>
          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
          <div class="flex gap-3">
            <button type="submit" class="admin-btn-primary flex-1">Create</button>
            <button type="button" @click="showModal = false" class="admin-btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminUserAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const admins = ref([]);
const showModal = ref(false);
const error = ref('');
const form = ref({ name: '', email: '', phone: '', password: '' });

const fetchAdmins = async () => {
  try { const res = await adminUserAPI.getAll(); admins.value = res.data || []; }
  catch (e) { toast.error('Failed'); } finally { loading.value = false; }
};

const openCreate = () => { form.value = { name: '', email: '', phone: '', password: '' }; error.value = ''; showModal.value = true; };

const createAdmin = async () => {
  try {
    await adminUserAPI.create(form.value);
    toast.success('Admin created');
    showModal.value = false; fetchAdmins();
  } catch (e) { error.value = e.message || 'Creation failed'; }
};

const toggleStatus = async (id) => {
  try { await adminUserAPI.toggleStatus(id); toast.success('Status toggled'); fetchAdmins(); }
  catch (e) { toast.error('Failed'); }
};

const deleteAdmin = async (id) => {
  if (!confirm('Delete this admin?')) return;
  try { await adminUserAPI.delete(id); toast.success('Deleted'); fetchAdmins(); }
  catch (e) { toast.error('Failed'); }
};

onMounted(fetchAdmins);
</script>
