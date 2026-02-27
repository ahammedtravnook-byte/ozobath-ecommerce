// ============================================
// OZOBATH - Blog Model
// ============================================
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, maxlength: 500 },
  content: { type: String, required: true },
  featuredImage: {
    url: String,
    publicId: String,
    alt: String,
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: String,
  tags: [String],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  views: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
}, {
  timestamps: true,
});

blogSchema.index({ slug: 1 });
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Blog', blogSchema);
