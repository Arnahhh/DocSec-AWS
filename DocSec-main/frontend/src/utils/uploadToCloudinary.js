// src/utils/uploadToCloudinary.js

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a file directly from the browser to Cloudinary using an
 * unsigned upload preset (no backend / API secret needed).
 *
 * @param {File}     file         - The File object to upload
 * @param {Function} onProgress   - Optional callback(percent: number)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadToCloudinary(file, onProgress) {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            "Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env"
        );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    // Store under a logical folder per file type
    formData.append("folder", "docchain/documents");

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve({
                    url:      data.secure_url,   // https://res.cloudinary.com/...
                    publicId: data.public_id,    // docchain/documents/filename
                });
            } else {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err?.error?.message ?? "Cloudinary upload failed."));
            }
        });

        xhr.addEventListener("error", () =>
            reject(new Error("Network error during Cloudinary upload."))
        );

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
        xhr.send(formData);
    });
}
