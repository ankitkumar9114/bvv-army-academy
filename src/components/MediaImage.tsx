import type { ComponentProps } from 'react';
import { useMediaUrl } from '../lib/catalog';
import { ImagePlaceholder } from './ImagePlaceholder';

/**
 * ImagePlaceholder that shows an image uploaded in the CMS (`imageId` → `media` doc) when there is one, then `src`,
 * then the illustration. Same props as ImagePlaceholder.
 */
export function MediaImage({ imageId, src, ...rest }: ComponentProps<typeof ImagePlaceholder> & { imageId?: string }) {
  const url = useMediaUrl(imageId);
  return <ImagePlaceholder {...rest} src={url ?? src} />;
}
