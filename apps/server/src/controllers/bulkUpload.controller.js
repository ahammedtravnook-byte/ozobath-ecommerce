// ============================================
// OZOBATH - Bulk Product Upload Controller
// Accepts .xlsx file, creates/updates products
// ============================================
const XLSX = require('xlsx');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const slugify = require('../utils/slugify');

// POST /products/bulk-upload
// Body: multipart form with file field "excel"
const bulkUploadProducts = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please upload an Excel file (.xlsx)');

  // Parse workbook
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) throw new ApiError(400, 'Excel file is empty or has no data rows');

  // Load all categories for name→ID lookup
  const categories = await Category.find({}).lean();
  const catMap = {};
  categories.forEach(c => {
    catMap[c.name.toLowerCase()] = c._id;
    catMap[c.slug.toLowerCase()] = c._id;
  });

  const results = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row (1-indexed + header)

    try {
      // Required field check
      if (!row['Name'] || !row['Price'] || !row['Category']) {
        results.errors.push({ row: rowNum, error: 'Missing required fields: Name, Price, Category' });
        continue;
      }

      // Category lookup
      const catKey = String(row['Category']).trim().toLowerCase();
      const categoryId = catMap[catKey];
      if (!categoryId) {
        results.errors.push({ row: rowNum, name: row['Name'], error: `Category "${row['Category']}" not found` });
        continue;
      }

      // Build product data
      const name = String(row['Name']).trim();
      const baseSlug = slugify(name);

      // Parse images — semicolon-separated URLs
      const images = row['Image URLs']
        ? String(row['Image URLs']).split(';').map(u => u.trim()).filter(Boolean).map(url => ({ url }))
        : [];

      // Parse tags — comma-separated
      const tags = row['Tags']
        ? String(row['Tags']).split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Parse badges — comma-separated
      const validBadges = ['best-seller', 'new', 'featured', 'sale', 'limited'];
      const badges = row['Badges']
        ? String(row['Badges']).split(',').map(b => b.trim().toLowerCase()).filter(b => validBadges.includes(b))
        : [];

      // Parse specifications — format: "Key:Value|Key:Value"
      const specifications = row['Specifications']
        ? String(row['Specifications']).split('|').map(s => {
            const [key, ...rest] = s.split(':');
            return key && rest.length ? { key: key.trim(), value: rest.join(':').trim() } : null;
          }).filter(Boolean)
        : [];

      const productData = {
        name,
        shortDescription: String(row['Short Description'] || '').trim(),
        description: String(row['Description'] || name).trim(),
        sku: String(row['SKU'] || '').trim() || undefined,
        brand: String(row['Brand'] || 'OZOBATH').trim(),
        price: Number(row['Price']) || 0,
        compareAtPrice: Number(row['Compare At Price'] || row['MRP'] || 0) || undefined,
        costPrice: Number(row['Cost Price'] || 0) || undefined,
        stock: Number(row['Stock'] || 0),
        category: categoryId,
        subCategory: String(row['Sub Category'] || '').trim() || undefined,
        images,
        tags,
        badges,
        specifications,
        isActive: row['Active'] !== undefined ? String(row['Active']).toLowerCase() !== 'false' : true,
        isFeatured: String(row['Featured'] || '').toLowerCase() === 'true',
        metaTitle: String(row['Meta Title'] || '').trim() || undefined,
        metaDescription: String(row['Meta Description'] || '').trim() || undefined,
      };

      // Check if product with same SKU or name exists
      let existing = null;
      if (productData.sku) {
        existing = await Product.findOne({ sku: productData.sku });
      }
      if (!existing) {
        existing = await Product.findOne({ name });
      }

      if (existing) {
        await Product.findByIdAndUpdate(existing._id, productData);
        results.updated++;
      } else {
        // Generate unique slug
        let slug = baseSlug;
        const slugExists = await Product.findOne({ slug });
        if (slugExists) slug = `${baseSlug}-${Date.now()}`;
        await Product.create({ ...productData, slug });
        results.created++;
      }
    } catch (err) {
      results.errors.push({ row: rowNum, name: row['Name'], error: err.message });
    }
  }

  sendResponse(res, 200, results,
    `Bulk upload complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
  );
});

// GET /products/bulk-upload/template — download sample Excel
const downloadTemplate = asyncHandler(async (req, res) => {
  const headers = [
    'Name', 'SKU', 'Brand', 'Category', 'Sub Category',
    'Short Description', 'Description',
    'Price', 'Compare At Price', 'Cost Price', 'Stock',
    'Image URLs', 'Tags', 'Badges', 'Specifications',
    'Active', 'Featured', 'Meta Title', 'Meta Description',
  ];

  const sampleRow = {
    'Name': 'Partial Shower Enclosure — Chrome Glossy',
    'SKU': 'OZO-PSE-CHR-001',
    'Brand': 'OZOBATH',
    'Category': 'Shower Enclosures',
    'Sub Category': 'Partial',
    'Short Description': 'Premium chrome partial shower enclosure, priced per sqft',
    'Description': 'Walk-in partial shower enclosure with chrome glossy finish. Available in clear, frosted, fluted and lacquered glass. Price is per square foot.',
    'Price': 559,
    'Compare At Price': 699,
    'Cost Price': 350,
    'Stock': 999,
    'Image URLs': 'https://example.com/image1.jpg;https://example.com/image2.jpg',
    'Tags': 'shower, chrome, partial, premium',
    'Badges': 'best-seller,new',
    'Specifications': 'Glass Type:Clear|Finish:Chrome Glossy|Price Unit:Per SQFT|Min Order:10 SQFT',
    'Active': 'true',
    'Featured': 'false',
    'Meta Title': 'Partial Chrome Shower Enclosure | OZOBATH',
    'Meta Description': 'Buy premium partial chrome shower enclosure at ₹559/sqft.',
  };

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });

  // Set column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 20) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="ozobath-product-template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = { bulkUploadProducts, downloadTemplate };
