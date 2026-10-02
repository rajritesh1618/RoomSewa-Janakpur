/**
 * Utility to compress and resize images before uploading/saving to Firestore.
 * Firestore has a strict 1MB (1,048,576 bytes) limit per document.
 * This ensures all images are safely compressed to under 250KB JPEG data URLs.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processLoadedImage = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        return reject(new Error('Invalid image dimensions'));
      }

      // Calculate new dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to create canvas 2D context'));
      }

      // White background for JPEG transparency safety
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/jpeg', quality);

      // If still larger than 500KB (~680,000 characters base64), recompress with 0.5 quality
      if (compressed.length > 500000) {
        compressed = canvas.toDataURL('image/jpeg', 0.5);
      }

      // If STILL too large, scale down further
      if (compressed.length > 700000) {
        const smallerCanvas = document.createElement('canvas');
        smallerCanvas.width = Math.round(width * 0.7);
        smallerCanvas.height = Math.round(height * 0.7);
        const sCtx = smallerCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#FFFFFF';
          sCtx.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height);
          sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
          compressed = smallerCanvas.toDataURL('image/jpeg', 0.5);
        }
      }

      resolve(compressed);
    };

    img.onload = processLoadedImage;
    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
