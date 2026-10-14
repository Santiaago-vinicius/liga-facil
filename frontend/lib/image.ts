export function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(size / img.width, size / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => reject(new Error('Imagem inválida'));
    img.src = URL.createObjectURL(file);
  });
}