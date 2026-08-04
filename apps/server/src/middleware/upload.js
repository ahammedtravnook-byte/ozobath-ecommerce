// ============================================
// OZOBATH - Multer Upload Middleware (Memory Storage)
// ============================================
const multer = require('multer');
const ApiError = require('../utils/apiError');

const storage = multer.memoryStorage();

// ─── Images ──────────────────────────────────────
// SVG is deliberately excluded. It is an executable document format: an SVG
// containing <script> runs in the browser under the delivery origin. It was
// previously accepted, and the only thing limiting the impact was
// Cloudinary's default attachment disposition — a third party's default, not
// a control this application owns.
//
// `file.mimetype` comes from the client's multipart headers and is trivially
// forged, so it is a first filter only; the magic-byte check below is what
// actually constrains the content.
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Leading bytes for each format we accept.
const MAGIC = [
  { ext: 'jpg',  bytes: [0xFF, 0xD8, 0xFF] },
  { ext: 'png',  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { ext: 'gif',  bytes: [0x47, 0x49, 0x46, 0x38] },              // GIF8
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },              // RIFF (+ WEBP at offset 8)
];

const matchesMagic = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  for (const sig of MAGIC) {
    const ok = sig.bytes.every((b, i) => buffer[i] === b);
    if (!ok) continue;
    // WEBP needs the container check too — RIFF alone is also .wav/.avi.
    if (sig.ext === 'webp') {
      return buffer.toString('ascii', 8, 12) === 'WEBP';
    }
    return true;
  }
  return false;
};

const imageFilter = (req, file, cb) => {
  if (IMAGE_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

// Verify the declared type against the actual bytes. Runs after multer has
// buffered the file, since the magic bytes are not available during
// fileFilter. Mount directly after `upload.single`/`upload.array`.
const verifyImageBytes = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    if (!matchesMagic(file.buffer)) {
      return next(new ApiError(
        400,
        `"${file.originalname}" does not appear to be a valid JPEG, PNG, WebP or GIF.`
      ));
    }
  }
  next();
};

// ─── Spreadsheets ────────────────────────────────
// Bulk product upload posts an .xlsx. It previously reused the image filter,
// which rejected every spreadsheet — the endpoint could not have worked.
const SHEET_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',   // some browsers send this for .xlsx
];

const sheetFilter = (req, file, cb) => {
  const looksLikeSheet = /\.(xlsx|xls)$/i.test(file.originalname || '');
  if (SHEET_MIME.includes(file.mimetype) && looksLikeSheet) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only .xlsx or .xls spreadsheet files are allowed.'), false);
  }
};

const uploadSheet = multer({
  storage,
  fileFilter: sheetFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Default export stays the image uploader so existing `require('.../upload')`
// call sites keep working; the named properties are the new additions.
module.exports = upload;
module.exports.uploadSheet = uploadSheet;
module.exports.verifyImageBytes = verifyImageBytes;
