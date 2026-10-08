const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Set the upload folder and file name
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safe}`);
    }
});

// Allow only image files
const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
    cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
