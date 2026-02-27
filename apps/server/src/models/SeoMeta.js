// ============================================
// OZOBATH - SEO Meta Model
// ============================================
const mongoose = require('mongoose');

const seoMetaSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  title: String,
  description: String,
  keywords: [String],
  ogImage: { url: String, publicId: String },
  canonicalUrl: String,
  robots: { type: String, default: 'index, follow' },
  structuredData: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

module.exports = mongoose.model('SeoMeta', seoMetaSchema);
