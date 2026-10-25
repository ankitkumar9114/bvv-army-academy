import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button, Icon } from '../components';
import { cn } from '../lib/cn';
import { focusRing } from '../styles/tokens';
import { deleteMedia, getOneDoc, saveMedia } from './data';
import { useDialogs } from './Dialogs';
import type { MediaPurpose } from '../types/firestore';
import { encodeCanvas, loadImage, maxDataUrl, OUTPUT, type ImageShape } from './imageTools';

interface MediaInfo {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

/** The image behind a media id, as the CMS reads it (any status). */
function useMedia(id: string | undefined) {
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setMedia(null);
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getOneDoc('media', id)
      .then((doc) => !cancelled && setMedia(doc ? (doc as unknown as MediaInfo) : null))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return { media, loading };
}

/** Frame the size of the picture on the site: the course card's 16:9 picture (~288px wide) or a square photo. */
const FRAME: Record<ImageShape, string> = {
  wide: 'aspect-video w-72',
  square: 'aspect-square w-48',
  // hero banners: big enough to judge the crop, in the exact shape of the saved picture
  heroDesktop: 'aspect-hero-desktop w-full max-w-2xl',
  heroTablet: 'aspect-video w-full max-w-md',
  heroMobile: 'aspect-hero-mobile w-48',
};
const frame = (shape: ImageShape) => cn('overflow-hidden rounded-xl border border-line bg-surface-subtle', FRAME[shape]);

/** Read-only thumbnail for the course editor's view mode. */
export function MediaPreview({ id, shape }: { id: string; shape: ImageShape }) {
  const { media, loading } = useMedia(id);
  return (
    <span className={cn(frame(shape), 'block')}>
      {media ? <img src={media.dataUrl} alt="" className="size-full object-cover" /> : loading ? <span className="block size-full animate-pulse" /> : null}
    </span>
  );
}

const MAX_ZOOM = 3;

/**
 * Crop editor: the picture fills a frame shaped like its slot; zoom with the slider or −/+, drag (or use the arrow keys)
 * to move it. The frame is a canvas at the saved size, so what you see is exactly what gets saved.
 */
function Cropper({ bitmap, shape, onDone, onCancel, busy }: { bitmap: ImageBitmap; shape: ImageShape; onDone: (canvas: HTMLCanvasElement) => void; onCancel: () => void; busy: boolean }) {
  const { width: W, height: H } = OUTPUT[shape];
  const cover = Math.max(W / bitmap.width, H / bitmap.height);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: (W - bitmap.width * cover) / 2, y: (H - bitmap.height * cover) / 2 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  // keep the picture covering the whole frame
  const clamp = useCallback(
    (x: number, y: number, z: number) => {
      const w = bitmap.width * cover * z;
      const h = bitmap.height * cover * z;
      return { x: Math.min(0, Math.max(W - w, x)), y: Math.min(0, Math.max(H - h, y)) };
    },
    [bitmap, cover, W, H],
  );

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bitmap, pos.x, pos.y, bitmap.width * cover * zoom, bitmap.height * cover * zoom);
  }, [bitmap, pos, zoom, cover, W, H]);

  // zoom around the frame's centre
  function zoomTo(next: number) {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    const cx = (W / 2 - pos.x) / zoom;
    const cy = (H / 2 - pos.y) / zoom;
    setPos(clamp(W / 2 - cx * z, H / 2 - cy * z, z));
    setZoom(z);
  }

  const toCanvas = () => (canvas.current ? W / canvas.current.getBoundingClientRect().width : 1);
  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const k = toCanvas();
    const dx = (e.clientX - drag.current.x) * k;
    const dy = (e.clientY - drag.current.y) * k;
    drag.current = { x: e.clientX, y: e.clientY };
    setPos((p) => clamp(p.x + dx, p.y + dy, zoom));
  }
  function onKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
    const step = 10;
    const move = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!move) return;
    e.preventDefault();
    setPos((p) => clamp(p.x + move[0], p.y + move[1], zoom));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
      <canvas
        ref={canvas}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="Picture position: drag, or use the arrow keys, to move it"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        className={cn(frame(shape), 'cursor-grab touch-none bg-surface active:cursor-grabbing', focusRing)}
      />
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Zoom out" onClick={() => zoomTo(zoom - 0.2)} className={cn('flex size-8 items-center justify-center rounded-full border border-line bg-surface text-ink', focusRing)}>
          <Icon name="remove" size={16} />
        </button>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => zoomTo(Number(e.target.value))}
          className="w-40 accent-primary-600"
        />
        <button type="button" aria-label="Zoom in" onClick={() => zoomTo(zoom + 0.2)} className={cn('flex size-8 items-center justify-center rounded-full border border-line bg-surface text-ink', focusRing)}>
          <Icon name="add" size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPos({ x: (W - bitmap.width * cover) / 2, y: (H - bitmap.height * cover) / 2 });
          }}
          className={cn('rounded-lg px-2 text-xs font-semibold text-primary-700', focusRing)}
        >
          Reset
        </button>
      </div>
      <p className="text-xs text-ink-muted">Drag the picture to move it; zoom to fill the frame. Saved at {W}×{H}.</p>
      <div className="flex gap-2">
        <Button size="sm" loading={busy} onClick={() => canvas.current && onDone(canvas.current)}>
          Use this image
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Image field: preview at the slot's size; Upload / Replace opens the crop editor; Delete removes the image.
 * The image is saved to `media` when you click "Use this image" and the field keeps its id (saved with the section).
 * Replace and Delete also delete the old image from the database.
 */
export function ImageField({
  value,
  onChange,
  shape,
  purpose,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  shape: ImageShape;
  purpose: MediaPurpose;
}) {
  const id = typeof value === 'string' && value ? value : undefined;
  const { media, loading } = useMedia(id);
  const input = useRef<HTMLInputElement>(null);
  const dialogs = useDialogs();
  const [editing, setEditing] = useState<ImageBitmap | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(file: File | undefined) {
    if (input.current) input.current.value = '';
    if (!file) return;
    setError('');
    try {
      setEditing(await loadImage(file));
    } catch (e) {
      setError((e as Error).message || 'Could not open this image.');
    }
  }

  async function save(canvas: HTMLCanvasElement) {
    setBusy(true);
    setError('');
    try {
      const newId = await saveMedia({ ...encodeCanvas(canvas, maxDataUrl(shape)), purpose });
      if (id) await deleteMedia(id).catch(() => {}); // replaced: the old image goes
      onChange(newId);
      editing?.close();
      setEditing(null);
    } catch (e) {
      setError((e as Error).message || 'Upload failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !(await dialogs.confirm({ title: 'Delete this image?', body: 'It is removed from the database. Save the section to update the page.', confirmLabel: 'Delete image', tone: 'danger' }))) return;
    setBusy(true);
    try {
      await deleteMedia(id);
      onChange(undefined);
    } catch (e) {
      setError((e as Error).message || 'Could not delete the image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      {editing ? (
        <Cropper
          bitmap={editing}
          shape={shape}
          busy={busy}
          onDone={save}
          onCancel={() => {
            editing.close();
            setEditing(null);
          }}
        />
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          <div className={frame(shape)}>
            {media ? (
              <img src={media.dataUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-ink-muted">
                {loading || busy ? <span className="size-full animate-pulse" /> : <Icon name="image" size={24} />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leftIcon={<Icon name="upload" size={16} />} disabled={busy} onClick={() => input.current?.click()}>
                {id ? 'Replace image' : 'Upload image'}
              </Button>
              {id && (
                <Button variant="ghost" size="sm" leftIcon={<Icon name="delete" size={16} />} disabled={busy} onClick={remove}>
                  Delete image
                </Button>
              )}
            </div>
            <p className="text-xs text-ink-muted">
              {media
                ? `${media.width}×${media.height} · ${Math.round(media.bytes / 1024)} KB`
                : shape === 'wide'
                  ? 'JPG, PNG or WebP. You can zoom and position it in a 16:9 frame like the course card.'
                  : shape === 'square'
                    ? 'JPG, PNG or WebP. You can zoom and position it in a square frame.'
                    : `JPG, PNG or WebP, best made at exactly ${OUTPUT[shape].width}×${OUTPUT[shape].height} px. You can zoom and position it in the frame.`}
            </p>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
