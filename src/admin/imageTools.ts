/**
 * Image helpers for the CMS (owner request, 24 Oct 2026: images in Firestore, no Storage billing).
 * The editor in ImageField.tsx lets the editor zoom and position the picture in a frame shaped like its slot on the
 * site; `encodeCanvas` then turns that frame into a WebP (JPEG where the browser can't) small enough for one
 * Firestore doc.
 */
export type ImageShape = 'wide' | 'square' | 'heroDesktop' | 'heroTablet' | 'heroMobile';

/** Saved size per slot: course card thumbnails are 16:9 like the card's picture (2× its width on phones); photos are square. */
export const OUTPUT: Record<ImageShape, { width: number; height: number }> = {
  wide: { width: 800, height: 450 },
  square: { width: 400, height: 400 },
  // home hero banners (owner request, 25 Oct): shown 700px tall on desktop and 500px on phones, tablet 16:9
  heroDesktop: { width: 1920, height: 700 },
  heroTablet: { width: 1280, height: 720 },
  heroMobile: { width: 1170, height: 1200 },
};

/** Hero banners may use most of a Firestore doc (1 MB); the other images stay small. */
export const isHero = (shape: ImageShape) => shape.startsWith('hero');

/** ~300 KB of image data; Firestore allows 1 MB per doc. */
const MAX_DATA_URL = 400_000;
const MAX_HERO_DATA_URL = 950_000;

export interface EncodedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

export const maxDataUrl = (shape: ImageShape) => (isHero(shape) ? MAX_HERO_DATA_URL : MAX_DATA_URL);

export async function loadImage(file: File): Promise<ImageBitmap> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  return createImageBitmap(file);
}

/** Lowers the quality step by step until the image fits in one Firestore doc. */
export function encodeCanvas(canvas: HTMLCanvasElement, max = MAX_DATA_URL): EncodedImage {
  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= max) {
      const bytes = Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);
      return { dataUrl, width: canvas.width, height: canvas.height, bytes };
    }
  }
  throw new Error('This image is too detailed to store. Try a smaller or simpler picture.');
}
