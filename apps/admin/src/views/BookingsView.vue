<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Bookings</h1>
      <div class="flex gap-2">
        <button @click="activeTab = 'slots'" :class="activeTab === 'slots' ? 'admin-btn-primary' : 'px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'">Manage Slots</button>
        <button @click="activeTab = 'video'" :class="activeTab === 'video' ? 'admin-btn-primary' : 'px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'">Video Bookings</button>
        <button @click="activeTab = 'site'" :class="activeTab === 'site' ? 'admin-btn-primary' : 'px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200'">Site Visits</button>
      </div>
    </div>

    <!-- ══════ TAB: MANAGE SLOTS ══════ -->
    <div v-if="activeTab === 'slots'" class="space-y-5">

      <!-- Bulk Create Card -->
      <div class="admin-card">
        <h2 class="text-base font-bold text-gray-800 mb-1">Create Weekly Slots</h2>
        <p class="text-xs text-gray-400 mb-5">Select working days and time slots — slots will be auto-generated for the next N weeks.</p>

        <!-- Day Picker -->
        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Working Days</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="day in weekDays"
              :key="day.value"
              @click="toggleDay(day.value)"
              :class="selectedDays.includes(day.value)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'"
              class="px-4 py-2 text-sm font-semibold rounded-lg border transition-all"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <!-- Time Slots -->
        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Time Slots</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ts in availableTimeSlots"
              :key="ts.startTime"
              @click="toggleTimeSlot(ts)"
              :class="isTimeSlotSelected(ts)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'"
              class="px-3 py-2 text-sm font-semibold rounded-lg border transition-all"
            >
              {{ ts.startTime }} – {{ ts.endTime }}
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-2">Click to toggle time slots on/off.</p>
        </div>

        <!-- Weeks Ahead -->
        <div class="mb-5 flex items-center gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Generate for next</label>
            <div class="flex items-center gap-2">
              <select v-model="weeksAhead" class="admin-input py-2 w-32">
                <option :value="1">1 week</option>
                <option :value="2">2 weeks</option>
                <option :value="4">4 weeks</option>
                <option :value="8">8 weeks</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="createBulkSlots"
            :disabled="bulkLoading || !selectedDays.length || !selectedTimeSlots.length"
            class="admin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="bulkLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
            {{ bulkLoading ? 'Creating...' : 'Generate Slots' }}
          </button>
          <p v-if="!selectedDays.length || !selectedTimeSlots.length" class="text-xs text-gray-400">Select at least one day and one time slot.</p>
        </div>
      </div>

      <!-- Slot List -->
      <div class="admin-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-gray-800">Upcoming Slots</h2>
          <input v-model="slotDateFilter" type="date" class="admin-input py-1.5 text-sm w-44" placeholder="Filter by date" />
        </div>

        <div v-if="slotsLoading" class="py-10 text-center">
          <div class="animate-spin w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
        </div>
        <div v-else-if="allSlots.length === 0" class="py-10 text-center text-gray-400 text-sm">No slots found. Generate some above.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-2">Date</th>
                <th class="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-2">Time</th>
                <th class="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-2">Status</th>
                <th class="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-2">Booked By</th>
                <th class="pb-3 px-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="slot in allSlots" :key="slot._id" class="hover:bg-gray-50">
                <td class="py-3 px-2 font-medium text-gray-800">{{ formatDate(slot.date) }}</td>
                <td class="py-3 px-2 text-gray-600">{{ slot.startTime }} – {{ slot.endTime }}</td>
                <td class="py-3 px-2">
                  <span :class="slot.isBooked ? 'bg-blue-100 text-blue-700' : slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {{ slot.isBooked ? 'Booked' : slot.isActive ? 'Available' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-3 px-2 text-xs text-gray-500">{{ slot.booking?.customerName || '—' }}</td>
                <td class="py-3 px-2 text-right">
                  <button
                    v-if="!slot.isBooked"
                    @click="deleteSlot(slot._id)"
                    class="text-xs text-red-500 hover:text-red-700 font-medium"
                  >Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════ TAB: VIDEO BOOKINGS ══════ -->
    <div v-if="activeTab === 'video'">
      <div class="admin-card overflow-hidden">
        <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
        <div v-else-if="videoBookings.length === 0" class="p-12 text-center text-gray-400">No video call bookings yet.</div>
        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Customer</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Date & Time</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Message</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="b in videoBookings" :key="b._id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-gray-900">{{ b.booking?.customerName }}</p>
                <p class="text-xs text-gray-400">{{ b.booking?.customerEmail }}</p>
                <p class="text-xs text-gray-400">{{ b.booking?.customerPhone }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ formatDate(b.date) }}<br/><span class="text-xs">{{ b.startTime }} – {{ b.endTime }}</span></td>
              <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{{ b.booking?.message || '—' }}</td>
              <td class="px-4 py-3">
                <select :value="b.status" @change="updateSlotStatus(b._id, $event.target.value)" class="admin-input text-xs py-1">
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════ TAB: SITE VISITS ══════ -->
    <div v-if="activeTab === 'site'">
      <div class="admin-card overflow-hidden">
        <div v-if="loadingSite" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
        <div v-else-if="siteVisits.length === 0" class="p-12 text-center text-gray-400">No site visit bookings yet.</div>
        <table v-else class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Customer</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Preferred Date</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">City</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Message</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sv in siteVisits" :key="sv._id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-gray-900">{{ sv.customerName }}</p>
                <p class="text-xs text-gray-400">{{ sv.email }}</p>
                <p class="text-xs text-gray-400">{{ sv.phone }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">
                {{ sv.preferredDate?.slice(0, 10) }}
                <span v-if="sv.preferredTime" class="text-xs text-gray-400 ml-1">{{ sv.preferredTime }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ sv.city || '—' }}</td>
              <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{{ sv.message || '—' }}</td>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { bookingAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const activeTab = ref('slots');

// ── Slot management ──────────────────────────────
const weekDays = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const availableTimeSlots = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '12:00', endTime: '13:00' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '18:00' },
];

const selectedDays = ref([1, 2, 3, 4, 5, 6]); // Mon–Sat default
const selectedTimeSlots = ref([
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
]);
const weeksAhead = ref(4);
const bulkLoading = ref(false);

const allSlots = ref([]);
const slotsLoading = ref(false);
const slotDateFilter = ref('');

const toggleDay = (val) => {
  const idx = selectedDays.value.indexOf(val);
  if (idx === -1) selectedDays.value.push(val);
  else selectedDays.value.splice(idx, 1);
};

const isTimeSlotSelected = (ts) =>
  selectedTimeSlots.value.some(s => s.startTime === ts.startTime);

const toggleTimeSlot = (ts) => {
  const idx = selectedTimeSlots.value.findIndex(s => s.startTime === ts.startTime);
  if (idx === -1) selectedTimeSlots.value.push({ ...ts });
  else selectedTimeSlots.value.splice(idx, 1);
};

const fetchAllSlots = async () => {
  try {
    slotsLoading.value = true;
    const res = await bookingAPI.getAllSlots(slotDateFilter.value || null);
    allSlots.value = res.data || [];
  } catch {
    toast.error('Failed to load slots');
  } finally {
    slotsLoading.value = false;
  }
};

const createBulkSlots = async () => {
  try {
    bulkLoading.value = true;
    const res = await bookingAPI.createBulkSlots({
      days: selectedDays.value,
      timeSlots: selectedTimeSlots.value,
      weeksAhead: weeksAhead.value,
    });
    toast.success(`${res.data?.count || 0} slots created successfully`);
    fetchAllSlots();
  } catch (e) {
    toast.error(e?.message || 'Failed to create slots');
  } finally {
    bulkLoading.value = false;
  }
};

const deleteSlot = async (id) => {
  if (!confirm('Delete this slot?')) return;
  try {
    await bookingAPI.deleteSlot(id);
    toast.success('Slot deleted');
    allSlots.value = allSlots.value.filter(s => s._id !== id);
  } catch {
    toast.error('Failed to delete slot');
  }
};

watch(slotDateFilter, fetchAllSlots);

// ── Video bookings ────────────────────────────────
const loading = ref(false);
const videoBookings = ref([]);

const fetchVideoBookings = async () => {
  try {
    loading.value = true;
    const res = await bookingAPI.getVideoCallBookings();
    videoBookings.value = res.data || [];
  } catch {
    toast.error('Failed to load bookings');
  } finally {
    loading.value = false;
  }
};

const updateSlotStatus = async (id, status) => {
  try {
    await bookingAPI.updateSlot(id, { status });
    toast.success('Updated');
    fetchVideoBookings();
  } catch {
    toast.error('Failed');
  }
};

// ── Site visits ───────────────────────────────────
const loadingSite = ref(false);
const siteVisits = ref([]);

const fetchSiteVisits = async () => {
  try {
    loadingSite.value = true;
    const res = await bookingAPI.getSiteVisits();
    siteVisits.value = res.data || [];
  } catch {
    toast.error('Failed to load site visits');
  } finally {
    loadingSite.value = false;
  }
};

const updateSiteVisitStatus = async (id, status) => {
  try {
    await bookingAPI.updateSiteVisit(id, { status });
    toast.success('Updated');
    fetchSiteVisits();
  } catch {
    toast.error('Failed');
  }
};

// ── Helpers ───────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
};

watch(activeTab, (tab) => {
  if (tab === 'slots') fetchAllSlots();
  else if (tab === 'video') fetchVideoBookings();
  else if (tab === 'site') fetchSiteVisits();
});

onMounted(() => {
  fetchAllSlots();
  fetchSiteVisits();
});
</script>
