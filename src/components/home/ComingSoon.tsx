import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { getContactSettings, telHref } from '@/lib/site-settings';

/**
 * Pre-launch holding page. Contact details come from the same admin-editable
 * setting the footer uses, so there's nothing extra to keep in sync.
 */
export async function ComingSoon() {
  const contact = await getContactSettings();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden">
      {/* Soft brand wash behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(60rem 30rem at 15% -10%, var(--brand), transparent 60%), radial-gradient(45rem 25rem at 110% 20%, var(--brand), transparent 55%)',
        }}
      />

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

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/about" className="btn-brand">
              About us <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`mailto:${contact.email}`} className="btn-outline">
              <Mail className="h-4 w-4" /> Get in touch
            </a>
          </div>

          <div className="mx-auto mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
            <ContactCard icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            <ContactCard icon={Phone} label="Phone" value={contact.phone} href={telHref(contact.phone)} />
            <ContactCard icon={MapPin} label="Address" value={contact.address} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon, label, value, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="card h-full p-4 text-center transition hover:border-brand">
      <Icon className="mx-auto h-5 w-5 text-brand" />
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line break-words text-sm font-semibold text-ink dark:text-gray-100">
        {value}
      </p>
    </div>
  );
  return href ? <a href={href} className="block h-full">{body}</a> : body;
}
