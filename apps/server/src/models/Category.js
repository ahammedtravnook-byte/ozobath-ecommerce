// ============================================
// OZOBATH - Category Model
// ============================================
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  image: {
    url: String,
    publicId: String,
  },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 },
  seoTitle: String,
  seoDescription: String,
}, {
  timestamps: true,
});

categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });

module.exports = mongoose.model('Category', categorySchema);
