import { encode } from 'blurhash';

export const calculateBlurhash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.addEventListener('load', () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const width = 32;
      const height = Math.round((img.height / img.width) * width);
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      context.drawImage(img, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const hash = encode(
        imageData.data,
        imageData.width,
        imageData.height,
        4,
        4,
      );
      resolve(hash);
    });

    img.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for blurhash calculation'));
    });

    img.src = objectUrl;
  });
};
