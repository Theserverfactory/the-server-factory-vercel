import { PhotoBackdrop } from '@/components/layout/PhotoBackdrop';

/**
 * Pre-launch holding page. Deliberately just the badge, wordmark and one line
 * of copy — contact details sit in the footer chrome rather than being
 * repeated in the body.
 */
export function ComingSoon() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden">
      <PhotoBackdrop variant="full" priority />

      <div className="container-page relative py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            Launching soon
          </span>

          <h1 className="heading-hero mt-6 font-display font-extrabold tracking-tight">
            <span className="text-brand">SERVER</span>
            <span className="text-ink dark:text-white">FACTORY</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-ink-muted dark:text-gray-400 sm:text-lg">
            India&apos;s configurator-first marketplace for enterprise servers, GPU workstations and
            data-centre components — Dell, HPE, HP, Lenovo and more. We&apos;re putting the finishing
            touches to the store.
          </p>
        </div>
      </div>
    </div>
  );
}
