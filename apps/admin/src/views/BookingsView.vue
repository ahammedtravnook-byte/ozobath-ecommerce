<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Bookings</h1>
      <div class="flex gap-3">
        <button @click="activeTab = 'video'" :class="activeTab === 'video' ? 'admin-btn-primary' : 'px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg'" >Video Calls</button>
        <button @click="activeTab = 'site'" :class="activeTab === 'site' ? 'admin-btn-primary' : 'px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg'" >Site Visits</button>
      </div>
    </div>

    <!-- Video Call Bookings -->
    <div v-if="activeTab === 'video'">
      <div class="admin-card mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ videoBookings.length }} bookings</p>
        <button @click="showSlotModal = true" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Create Slot</button>
      </div>
      <div class="admin-card overflow-hidden">
        <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
        <div v-else-if="videoBookings.length === 0" class="p-12 text-center"><p class="text-gray-400">No video call bookings</p></div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="b in videoBookings" :key="b._id" class="p-4 hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ b.booking?.customerName || 'Available Slot' }}</p>
                <p class="text-xs text-gray-500">{{ b.date?.slice(0,10) }} · {{ b.startTime }} – {{ b.endTime }}</p>
                <p v-if="b.booking?.customerEmail" class="text-xs text-gray-400 mt-1">{{ b.booking.customerEmail }} · {{ b.booking.customerPhone }}</p>
                <p v-if="b.booking?.message" class="text-sm text-gray-500 mt-1">{{ b.booking.message }}</p>
              </div>
              <span :class="b.isBooked ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ b.isBooked ? 'Booked' : 'Available' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Site Visit Bookings -->
    <div v-if="activeTab === 'site'">
      <div class="admin-card overflow-hidden">
        <div v-if="loadingSite" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
        <div v-else-if="siteVisits.length === 0" class="p-12 text-center"><p class="text-gray-400">No site visit bookings</p></div>
        <table v-else class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Location</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sv in siteVisits" :key="sv._id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="text-sm font-medium text-gray-900">{{ sv.customerName }}</p>
                <p class="text-xs text-gray-400">{{ sv.email }} · {{ sv.phone }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sv.preferredDate?.slice(0,10) }} {{ sv.preferredTime || '' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ sv.location || sv.city || '—' }}</td>
              <td class="px-4 py-3">
                <select :value="sv.status" @change="updateSiteVisitStatus(sv._id, $event.target.value)" class="admin-input text-xs py-1">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Slot Modal -->
    <div v-if="showSlotModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">Create Video Call Slot</h2>
          <button @click="showSlotModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Date</label><input v-model="slotForm.date" type="date" class="admin-input w-full" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input v-model="slotForm.startTime" type="time" class="admin-input w-full" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">End Time</label><input v-model="slotForm.endTime" type="time" class="admin-input w-full" /></div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showSlotModal = false" class="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button @click="createSlot" class="admin-btn-primary">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue';
import { bookingAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const activeTab = ref('video'); const loading = ref(true); const loadingSite = ref(true);
const videoBookings = ref([]); const siteVisits = ref([]); const showSlotModal = ref(false);
const slotForm = ref({ date: '', startTime: '', endTime: '' });

const fetchVideoBookings = async () => { try { loading.value = true; const res = await bookingAPI.getVideoCallBookings(); videoBookings.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const fetchSiteVisits = async () => { try { loadingSite.value = true; const res = await bookingAPI.getSiteVisits(); siteVisits.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loadingSite.value = false; } };
const createSlot = async () => { try { await bookingAPI.createSlot(slotForm.value); toast.success('Slot created'); showSlotModal.value = false; fetchVideoBookings(); } catch (e) { toast.error('Failed'); } };
const updateSiteVisitStatus = async (id, status) => { try { await bookingAPI.updateSiteVisit(id, { status }); toast.success('Updated'); fetchSiteVisits(); } catch (e) { toast.error('Failed'); } };

watch(activeTab, (tab) => { if (tab === 'video') fetchVideoBookings(); else fetchSiteVisits(); });
onMounted(() => { fetchVideoBookings(); fetchSiteVisits(); });
</script>
