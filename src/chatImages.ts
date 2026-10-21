export const CHAT_IMAGE_TARGET_BYTES = 300 * 1024;

export async function compressChatImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= CHAT_IMAGE_TARGET_BYTES) return file;
  const source = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not read this image.'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image resizing is unavailable in this browser.');
    let maxEdge = Math.min(1600, Math.max(image.naturalWidth, image.naturalHeight));
    for (let pass = 0; pass < 8; pass++) {
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [.82, .68, .54, .4]) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        if (blob?.type === 'image/webp' && blob.size <= CHAT_IMAGE_TARGET_BYTES) {
          return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
        }
      }
      maxEdge = Math.round(maxEdge * .72);
    }
    throw new Error('This image could not be compressed below 300 KB. Try a smaller image.');
  } finally {
    URL.revokeObjectURL(source);
  }
}
