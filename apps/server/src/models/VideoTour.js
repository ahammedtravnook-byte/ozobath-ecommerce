// ============================================
// OZOBATH - Video Tour Model
// ============================================
// Videos shown by the "Watch Video" player on the storefront.
//
// Deliberately not folded into Banner or InstagramReel: a banner is an image
// with a link and a placement, and a reel is a vertical Instagram embed tied
// to products. A tour is a landscape player entry with a provider, a duration
// and a playlist position. Sharing a model would mean a schema where most
// fields are irrelevant to most rows.

const mongoose = require('mongoose');
const { parseVideoUrl } = require('../utils/videoUrl');

const videoTourSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 500 },

  // What the admin pasted. Kept verbatim so the field round-trips in the edit
  // form as they typed it.
  url: { type: String, required: true, trim: true },

  // Derived from `url` on save. Stored rather than computed per request so
  // the client never has to know how to parse a provider URL.
  provider: {
    type: String,
    enum: ['youtube', 'vimeo'],
    required: true,
  },
  videoId: { type: String, required: true },
  embedUrl: { type: String, required: true },

  // Falls back to the provider thumbnail; an uploaded one wins.
  thumbnail: {
    url: String,
    publicId: String,
  },

  // Free text ("3:56") rather than seconds: it is display-only, and asking an
  // admin to convert to seconds invites mistakes for no benefit.
  duration: { type: String, trim: true },

  // Which surfaces may show this video. 'home-hero' backs the Watch Video
  // button; more placements can be added without a schema change.
  placement: {
    type: String,
    enum: ['home-hero', 'shop', 'about', 'experience-centre'],
    default: 'home-hero',
  },

  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// The public list filters on placement + isActive and sorts by order.
videoTourSchema.index({ placement: 1, isActive: 1, order: 1 });

/**
 * Derive provider fields from the pasted URL.
 *
 * A pre-save hook rather than controller logic, so every write path — REST,
 * a seed, a future bulk import — produces a consistent record. Rejecting here
 * also means an unembeddable URL can never reach the database.
 */
videoTourSchema.pre('validate', function deriveVideoFields(next) {
  if (!this.isModified('url')) return next();

  const parsed = parseVideoUrl(this.url);
  if (!parsed) {
    return next(new Error('Unrecognised video URL. Paste a YouTube or Vimeo link.'));
  }

  this.provider = parsed.provider;
  this.videoId = parsed.videoId;
  this.embedUrl = parsed.embedUrl;

  // Only fill the thumbnail when the admin has not supplied one.
  if (!this.thumbnail?.url && parsed.thumbnailUrl) {
    this.thumbnail = { ...(this.thumbnail || {}), url: parsed.thumbnailUrl };
  }

  next();
});

module.exports = mongoose.model('VideoTour', videoTourSchema);
