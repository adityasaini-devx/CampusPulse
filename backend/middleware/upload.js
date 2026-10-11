const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");
const { Readable } = require("stream");

let storage;

if (process.env.NODE_ENV === "production") {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
        process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error(
            "Cloudinary storage requires CLOUDINARY_CLOUD_NAME, " +
            "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in production"
        );
    }

    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });

    const folder = process.env.CLOUDINARY_FOLDER || "campuspulse";

    storage = {
        _handleFile(req, file, cb) {
            let completed = false;
            let cleaning = false;
            const finish = (error, info) => {
                if (completed) return;
                completed = true;
                cb(error, info);
            };
            const fail = (error, result) => {
                if (completed || cleaning) return;
                if (!result?.public_id) {
                    finish(error);
                    return;
                }

                cleaning = true;
                cloudinary.uploader.destroy(result.public_id, cleanupError => {
                    if (cleanupError) {
                        error.message += `; Cloudinary cleanup failed: ${cleanupError.message}`;
                    }
                    finish(error);
                });
            };
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, resource_type: "image" },
                (error, result) => {
                    if (error) return fail(error, result);
                    if (!result?.secure_url) {
                        return fail(
                            new Error("Cloudinary upload returned no secure URL"),
                            result
                        );
                    }

                    finish(null, {
                        path: result.secure_url,
                        filename: result.public_id,
                        public_id: result.public_id,
                        size: result.bytes
                    });
                }
            );

            uploadStream.on("error", error => fail(error));
            file.stream.on("error", error => {
                uploadStream.destroy(error);
                fail(error);
            });
            file.stream.pipe(uploadStream);
        },
        _removeFile(req, file, cb) {
            if (!file.public_id) return cb(null);

            cloudinary.uploader.destroy(file.public_id, error => cb(error));
        }
    };
} else {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const extensions = { jpeg: "jpg", png: "png", webp: "webp" };
            const extension = extensions[file.detectedFormat];
            if (!extension) {
                cb(new Error("Validated image format is unavailable"));
                return;
            }
            cb(null, `${crypto.randomUUID()}.${extension}`);
        }
    });
}

function hasMatchingImageSignature(mimetype, header) {
    if (mimetype === "image/jpeg") {
        return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    }
    if (mimetype === "image/png") {
        return header.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }
    if (mimetype === "image/webp") {
        return header.toString("ascii", 0, 4) === "RIFF" &&
            header.toString("ascii", 8, 12) === "WEBP";
    }
    return false;
}

const validatingStorage = {
    _handleFile(req, file, cb) {
        const chunks = [];
        let bytesRead = 0;
        let settled = false;

        const cleanup = () => {
            file.stream.removeListener("data", onData);
            file.stream.removeListener("end", onEnd);
            file.stream.removeListener("error", onError);
        };
        const reject = error => {
            if (settled) return;
            settled = true;
            cleanup();
            cb(error);
            file.stream.resume();
        };
        const onError = error => reject(error);
        const onEnd = async () => {
            if (settled) return;
            settled = true;
            cleanup();

            const buffer = Buffer.concat(chunks, bytesRead);
            const header = buffer.subarray(0, 12);
            if (!hasMatchingImageSignature(file.mimetype, header)) {
                cb(new Error("Uploaded file content does not match an allowed image type"));
                return;
            }

            try {
                const image = sharp(buffer, {
                    failOn: "warning",
                    limitInputPixels: 40_000_000
                });
                const metadata = await image.metadata();
                const expectedFormats = {
                    "image/jpeg": "jpeg",
                    "image/png": "png",
                    "image/webp": "webp"
                };
                if (metadata.format !== expectedFormats[file.mimetype]) {
                    throw new Error("Decoded image format does not match its MIME type");
                }

                await sharp(buffer, {
                    failOn: "warning",
                    limitInputPixels: 40_000_000
                }).stats();

                if (typeof storage._handleFile !== "function") {
                    throw new Error("Upload storage is unavailable");
                }

                const validatedFile = {
                    ...file,
                    detectedFormat: metadata.format,
                    stream: Readable.from([buffer])
                };
                storage._handleFile(req, validatedFile, cb);
            } catch (error) {
                cb(new Error(`Uploaded file is not a valid image: ${error.message}`, {
                    cause: error
                }));
            }
        };
        const onData = chunk => {
            chunks.push(chunk);
            bytesRead += chunk.length;
        };

        file.stream.on("data", onData);
        file.stream.once("end", onEnd);
        file.stream.once("error", onError);
        file.stream.resume();
    },
    _removeFile(req, file, cb) {
        if (typeof storage._removeFile !== "function") {
            cb(null);
            return;
        }
        storage._removeFile(req, file, cb);
    }
};

// Allow only image files
const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
    cb(null, true);
};

module.exports = multer({
    storage: validatingStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});
