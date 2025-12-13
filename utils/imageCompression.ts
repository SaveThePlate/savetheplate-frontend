/**
 * Client-side image compression utility
 * Compresses and resizes images before upload to reduce file size and upload time
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeMB?: number; // Target max file size in MB
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1500,
  maxHeight: 1500,
  quality: 0.85,
  maxSizeMB: 1, // Target 1MB max
};

/**
 * Compresses an image file using HTML5 Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          );
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        const isPNG = file.type === 'image/png';
        const mimeType = isPNG ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // If still too large, compress more aggressively
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB > opts.maxSizeMB && opts.quality > 0.1) {
              // Recursively compress with lower quality
              const newFile = new File([blob], file.name, { type: mimeType });
              compressImage(newFile, {
                ...opts,
                quality: Math.max(0.1, opts.quality - 0.1),
              })
                .then(resolve)
                .catch(reject);
            } else {
              // Create new file with compressed blob
              const compressedFile = new File(
                [blob],
                file.name,
                { type: mimeType, lastModified: Date.now() }
              );
              resolve(compressedFile);
            }
          },
          mimeType,
          opts.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple image files
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Promise<File[]> - Array of compressed image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Checks if an image needs compression
 * @param file - The image file to check
 * @param maxSizeMB - Maximum size in MB before compression is needed
 * @returns boolean - True if compression is recommended
 */
export function shouldCompress(file: File, maxSizeMB: number = 1): boolean {
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB > maxSizeMB;
}

