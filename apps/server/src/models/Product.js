// ============================================
// OZOBATH - Product Model
// ============================================
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String, maxlength: 300 },
  sku: { type: String, unique: true, sparse: true },

  // HSN code — the goods classification printed on every GST invoice.
  // 4, 6 or 8 digits depending on turnover. Not required at the schema
  // level: products predate the field, and blocking a product edit until
  // someone sources a code would stall the catalogue. The invoice prints
  // "-" when absent, which is visible and fixable.
  hsn: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^\d{4}(\d{2})?(\d{2})?$/.test(v),
      message: 'HSN must be 4, 6 or 8 digits.',
    },
  },

  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0 },

  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: String, trim: true },

  images: [{
    url: { type: String, required: true },
    publicId: String,
    alt: String,
    order: { type: Number, default: 0 },
  }],

  variants: [{
    name: String,
    options: [{
      label: String,
      value: String,
      priceModifier: { type: Number, default: 0 },
    }],
  }],

  specifications: [{
    key: String,
    value: String,
  }],

  badges: [{
    type: String,
    enum: ['best-seller', 'new', 'featured', 'sale', 'limited'],
  }],

  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true },

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },

  // Delivery settings (per-product override)
  freeDelivery: { type: Boolean, default: false },
  deliveryCharge: { type: Number, default: 0, min: 0 },

  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, default: 'cm' },
  },

  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],

  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Indexes for performance
// NOTE: the unique:true on the field above already creates this index;
// declaring it again produced a duplicate-index warning at boot.
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ badges: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });

// The storefront listing always filters on isActive and then sorts. Without a
// compound index Mongo filters on isActive, then sorts the whole matching set
// in memory — which fails outright past 32MB of results.
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, salesCount: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });

// Dashboard low-stock widget.
productSchema.index({ isActive: 1, stock: 1 });
productSchema.index({ name: 'text', description: 'text', seoKeywords: 'text' });

module.exports = mongoose.model('Product', productSchema);
