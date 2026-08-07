<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Video tours</h1>
        <p class="text-[13px] text-slate-500 mt-0.5">
          Videos shown by the “Watch Video” player on the storefront
        </p>
      </div>
      <button class="dt-btn-primary" @click="openCreate">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Add video
      </button>
    </div>

    <!-- ─── Where these appear ──────────────────── -->
    <div class="dt-surface p-4 mb-4 bg-blue-50/50 border-blue-100">
      <p class="text-[13px] font-medium text-blue-900 mb-1.5">Where do these show?</p>
      <ul class="text-[12.5px] text-blue-700 space-y-1">
        <li><span class="font-medium">Home hero</span> — the “Watch Video” button under the homepage headline. The first video plays; the rest form the playlist.</li>
        <li><span class="font-medium">Order</span> — lowest number plays first. Only active videos are shown.</li>
      </ul>
    </div>

    <!-- ─── List ────────────────────────────────── -->
    <div class="dt-surface">
      <div v-if="loading" class="p-4 space-y-3">
        <div v-for="n in 3" :key="n" class="flex gap-4 items-center">
          <div class="dt-skel w-32 h-[72px] rounded" />
          <div class="flex-1 space-y-2">
            <div class="dt-skel h-4 w-1/2" />
            <div class="dt-skel h-3 w-1/3" />
          </div>
        </div>
      </div>

      <div v-else-if="!tours.length" class="dt-empty">
        <p class="text-[14px] font-medium text-slate-900">No videos yet</p>
        <p class="text-[13px] text-slate-500 mt-1 max-w-sm">
          Paste a YouTube or Vimeo link and it will appear in the storefront player.
        </p>
        <button class="dt-btn mt-4" @click="openCreate">Add the first video</button>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div v-for="(tour, i) in tours" :key="tour._id" class="flex gap-4 p-4 items-center">
          <!-- Thumbnail -->
          <div class="relative w-32 h-[72px] rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            <img
              v-if="tour.thumbnail?.url"
              :src="tour.thumbnail.url"
              :alt="tour.title"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <span class="absolute inset-0 flex items-center justify-center">
              <span class="w-7 h-7 rounded-full bg-black/55 flex items-center justify-center">
                <svg class="w-3 h-3 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span
              v-if="tour.duration"
              class="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/75 text-white text-[10px] tabular-nums"
            >{{ tour.duration }}</span>
          </div>

          <!-- Detail -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-[14px] font-medium text-slate-900 truncate">{{ tour.title }}</p>
              <StatusBadge :status="tour.isActive ? 'active' : 'inactive'" dot />
              <span class="dt-badge bg-slate-50 text-slate-500 border-slate-200 capitalize">
                {{ tour.provider }}
              </span>
            </div>
            <p v-if="tour.description" class="text-[12.5px] text-slate-500 mt-0.5 line-clamp-1">
              {{ tour.description }}
            </p>
            <a
              :href="tour.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11.5px] text-slate-400 hover:text-blue-600 truncate block mt-0.5"
              @click.stop
            >{{ tour.url }}</a>
          </div>

          <!-- Order controls -->
          <div class="flex flex-col gap-0.5 shrink-0">
            <button
              class="dt-btn h-6 w-7 px-0"
              :disabled="i === 0 || reordering"
              aria-label="Move up"
              @click="move(i, -1)"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path d="m6 15 6-6 6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              class="dt-btn h-6 w-7 px-0"
              :disabled="i === tours.length - 1 || reordering"
              aria-label="Move down"
              @click="move(i, 1)"
            >
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <button class="dt-btn h-7 px-2 text-[12px]" @click="toggleActive(tour)">
              {{ tour.isActive ? 'Disable' : 'Enable' }}
            </button>
            <button class="dt-btn h-7 px-2 text-[12px]" @click="openEdit(tour)">Edit</button>
            <button
              class="dt-btn h-7 px-2 text-[12px] text-red-600 hover:bg-red-50 hover:border-red-300"
              :disabled="deletingId === tour._id"
              @click="remove(tour)"
            >
              {{ deletingId === tour._id ? '…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Create / edit ───────────────────────── -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40" @click="showModal = false" />
      <div class="relative bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 class="text-[15px] font-semibold text-slate-900 mb-4">
          {{ editing ? 'Edit video' : 'Add video' }}
        </h2>

        <form class="space-y-3.5" @submit.prevent="save">
          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Video link</label>
            <input
              v-model.trim="form.url"
              class="dt-input"
              placeholder="https://www.youtube.com/watch?v=…"
              required
            />
            <p class="text-[11.5px] mt-1" :class="urlPreview.ok ? 'text-emerald-600' : 'text-slate-400'">
              {{ urlPreview.message }}
            </p>
          </div>

          <!-- Live preview so a wrong link is obvious before saving. -->
          <div v-if="urlPreview.ok" class="rounded-md overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
            <iframe
              :src="urlPreview.embedUrl"
              class="w-full h-full"
              title="Video preview"
              frameborder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Title</label>
            <input v-model.trim="form.title" class="dt-input" required maxlength="160" />
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Description</label>
            <textarea v-model.trim="form.description" class="dt-input h-16 py-2 resize-none" maxlength="500" />
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-[13px] font-medium text-slate-700 mb-1">Duration</label>
              <input v-model.trim="form.duration" class="dt-input" placeholder="3:56" />
            </div>
            <div>
              <label class="block text-[13px] font-medium text-slate-700 mb-1">Order</label>
              <input v-model.number="form.order" type="number" min="0" class="dt-input" />
            </div>
            <div>
              <label class="block text-[13px] font-medium text-slate-700 mb-1">Status</label>
              <select v-model="form.isActive" class="dt-select w-full">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Placement</label>
            <select v-model="form.placement" class="dt-select w-full">
              <option value="home-hero">Home — hero “Watch Video”</option>
              <option value="shop">Shop page</option>
              <option value="about">About page</option>
              <option value="experience-centre">Experience Centre</option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">
              Custom thumbnail <span class="text-slate-400 font-normal">(optional)</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                class="dt-input flex-1 py-1.5 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[12px] file:bg-slate-100 file:text-slate-700"
                :disabled="uploading"
                @change="uploadThumb"
              />
              <span v-if="uploading" class="text-[12px] text-blue-600">Uploading…</span>
            </div>
            <p class="text-[11.5px] text-slate-400 mt-1">
              Leave empty to use the video’s own thumbnail.
            </p>
          </div>

          <div class="flex gap-2 justify-end pt-1">
            <button type="button" class="dt-btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="dt-btn-primary" :disabled="saving || !urlPreview.ok">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { videoTourAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { StatusBadge } from '@/components/ui';
import { parseVideoUrl } from '@/utils/videoUrl';

const toast = useToast();

const tours = ref([]);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const reordering = ref(false);
const deletingId = ref(null);

const showModal = ref(false);
const editing = ref(null);

const blankForm = () => ({
  title: '', description: '', url: '', duration: '',
  placement: 'home-hero', order: tours.value.length, isActive: true,
  thumbnail: { url: '', publicId: '' },
});

const form = ref(blankForm());

// Mirrors the server-side parser, so a bad link is rejected before a round
// trip and the admin sees the actual video they are about to publish.
const urlPreview = computed(() => {
  const raw = form.value.url;
  if (!raw) return { ok: false, message: 'Paste a YouTube or Vimeo link.' };
  const parsed = parseVideoUrl(raw);
  if (!parsed) return { ok: false, message: 'Not a recognised YouTube or Vimeo link.' };
  return {
    ok: true,
    message: `${parsed.provider === 'youtube' ? 'YouTube' : 'Vimeo'} · ${parsed.videoId}`,
    embedUrl: parsed.embedUrl,
  };
});

const fetchTours = async () => {
  try {
    loading.value = true;
    const res = await videoTourAPI.getAll();
    tours.value = res.data || [];
  } catch {
    toast.error('Failed to load video tours');
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.value = blankForm();
  showModal.value = true;
};

const openEdit = (tour) => {
  editing.value = tour._id;
  form.value = {
    title: tour.title || '',
    description: tour.description || '',
    url: tour.url || '',
    duration: tour.duration || '',
    placement: tour.placement || 'home-hero',
    order: tour.order ?? 0,
    isActive: tour.isActive !== false,
    thumbnail: { ...(tour.thumbnail || { url: '', publicId: '' }) },
  };
  showModal.value = true;
};

const uploadThumb = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploading.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.thumbnail = { url: res.data.url, publicId: res.data.publicId };
    toast.success('Thumbnail uploaded');
  } catch {
    toast.error('Thumbnail upload failed');
  } finally {
    uploading.value = false;
  }
};

const save = async () => {
  try {
    saving.value = true;
    const payload = { ...form.value };
    // Send no thumbnail at all when none was uploaded, so the server derives
    // the provider one rather than storing an empty object.
    if (!payload.thumbnail?.url) delete payload.thumbnail;

    if (editing.value) {
      await videoTourAPI.update(editing.value, payload);
      toast.success('Video updated');
    } else {
      await videoTourAPI.create(payload);
      toast.success('Video added');
    }
    showModal.value = false;
    fetchTours();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save video');
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (tour) => {
  const next = !tour.isActive;
  try {
    await videoTourAPI.update(tour._id, { isActive: next });
    tour.isActive = next;
    toast.success(next ? 'Video enabled' : 'Video disabled');
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to update');
  }
};

const remove = async (tour) => {
  if (!confirm(`Delete “${tour.title}”?`)) return;
  try {
    deletingId.value = tour._id;
    await videoTourAPI.delete(tour._id);
    toast.success('Video deleted');
    fetchTours();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to delete');
  } finally {
    deletingId.value = null;
  }
};

// Reordering is optimistic: the list reflects the new position immediately
// and is reverted if the server rejects it, so dragging never feels laggy.
const move = async (index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= tours.value.length) return;

  const snapshot = [...tours.value];
  const next = [...tours.value];
  [next[index], next[target]] = [next[target], next[index]];
  tours.value = next;

  try {
    reordering.value = true;
    await videoTourAPI.reorder(next.map((t, i) => ({ id: t._id, order: i })));
    next.forEach((t, i) => { t.order = i; });
  } catch {
    tours.value = snapshot;
    toast.error('Failed to reorder');
  } finally {
    reordering.value = false;
  }
};

onMounted(fetchTours);
</script>
