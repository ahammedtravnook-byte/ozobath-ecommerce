// ============================================
// OZOBATH - Dynamic Content Model  ★ CMS Core
// ============================================
const mongoose = require('mongoose');

const dynamicContentSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    enum: ['home', 'about', 'contact', 'shop', 'faq', 'experience', 'global'],
  },
  section: {
    type: String,
    required: true,
    enum: [
      'announcement_bar', 'hero_banner', 'category_tiles',
      'best_sellers', 'new_arrivals', 'trust_badges',
      'video_section', 'testimonials', 'google_reviews',
      'instagram_feed', 'blog_highlights', 'newsletter',
      'partner_logos', 'faq_section', 'page_header',
      'page_content', 'cta_banner', 'features_grid',
    ],
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  content: {
    title: String,
    subtitle: String,
    description: String,
    richText: String,
    buttonText: String,
    buttonLink: String,
    secondaryButtonText: String,
    secondaryButtonLink: String,

    image: {
      url: String,
      publicId: String,
      alt: String,
    },
    mobileImage: {
      url: String,
      publicId: String,
    },
    video: {
      url: String,
      type: { type: String, enum: ['youtube', 'vimeo', 'upload'] },
      thumbnail: String,
    },

    items: [mongoose.Schema.Types.Mixed],

    backgroundColor: String,
    textColor: String,
    overlayOpacity: { type: Number, min: 0, max: 1 },
  },

  startDate: Date,
  endDate: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

dynamicContentSchema.index({ page: 1, section: 1 });
dynamicContentSchema.index({ page: 1, order: 1 });

module.exports = mongoose.model('DynamicContent', dynamicContentSchema);
