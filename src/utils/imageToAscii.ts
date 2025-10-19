/**
 * Convert an image URL to ASCII art
 * Uses Canvas API to sample pixels and map brightness to ASCII characters
 */

// ASCII characters ordered from darkest to lightest
const ASCII_CHARS = [
  '@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.'
];

export interface ImageToAsciiOptions {
  width?: number;        // Width in characters (default: 60)
  heightRatio?: number;  // Height/width ratio to compensate for character aspect (default: 0.5)
  invert?: boolean;      // Invert brightness (default: false)
}

/**
 * Convert image URL to ASCII art string
 */
export async function imageToAscii(
  imageUrl: string,
  options: ImageToAsciiOptions = {}
): Promise<string> {
  const {
    width = 60,
    heightRatio = 0.5,
    invert = false
  } = options;

  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS

    img.onload = () => {
      try {
        // Calculate dimensions
        const scaledWidth = width;
        const scaledHeight = Math.floor(img.height * (scaledWidth / img.width) * heightRatio);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        // Get image data
        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        const pixels = imageData.data;

        // Convert to ASCII
        let ascii = '';
        for (let y = 0; y < scaledHeight; y++) {
          for (let x = 0; x < scaledWidth; x++) {
            const i = (y * scaledWidth + x) * 4;

            // Calculate brightness (0-255)
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const brightness = (r + g + b) / 3;

            // Map brightness to ASCII character
            const charIndex = invert
              ? Math.floor((brightness / 255) * (ASCII_CHARS.length - 1))
              : Math.floor(((255 - brightness) / 255) * (ASCII_CHARS.length - 1));

            ascii += ASCII_CHARS[charIndex];
          }
          ascii += '\n';
        }

        resolve(ascii);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Start loading image
    img.src = imageUrl;
  });
}

/**
 * Create a boxed ASCII art with border
 */
export function boxAsciiArt(ascii: string, title?: string): string {
  const lines = ascii.split('\n').filter(line => line.length > 0);
  const maxWidth = Math.max(...lines.map(line => line.length));

  const topBorder = '┌' + '─'.repeat(maxWidth + 2) + '┐';
  const bottomBorder = '└' + '─'.repeat(maxWidth + 2) + '┘';

  let result = topBorder + '\n';

  if (title) {
    const titlePadding = Math.max(0, maxWidth - title.length);
    const leftPad = Math.floor(titlePadding / 2);
    const rightPad = titlePadding - leftPad;
    result += '│ ' + ' '.repeat(leftPad) + title + ' '.repeat(rightPad) + ' │\n';
    result += '├' + '─'.repeat(maxWidth + 2) + '┤\n';
  }

  for (const line of lines) {
    const padding = maxWidth - line.length;
    result += '│ ' + line + ' '.repeat(padding) + ' │\n';
  }

  result += bottomBorder;

  return result;
}
