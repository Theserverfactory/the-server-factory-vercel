import Image from 'next/image';

/**
 * Faint server-room photo used behind page headers.
 *
 * Hosted rather than committed: there's no public/ directory, and
 * plus.unsplash.com is allow-listed in next.config.js alongside the other
 * image hosts.
 *
 * Single layer: the photo at reduced opacity. No scrim, no brand wash.
 */
const BACKDROP =
  'https://plus.unsplash.com/premium_photo-1740363268539-cd9093c3b5d1?w=2400&q=80&auto=format&fit=crop';

/**
 * Tuning knobs. Keep these as complete literal class strings, since Tailwind
 * scans source text and won't generate interpolated classes.
 */
const PHOTO_OPACITY = {
  full: 'opacity-[0.30] dark:opacity-[0.25]',
  header: 'opacity-[0.12] dark:opacity-[0.2]',
} as const;

export function PhotoBackdrop({
  variant = 'full',
  priority = false,
}: {
  variant?: 'full' | 'header';
  priority?: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={BACKDROP}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className={`object-cover ${PHOTO_OPACITY[variant]}`}
      />
    </div>
  );
}
