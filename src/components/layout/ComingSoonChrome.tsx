import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { getContactSettings, telHref } from '@/lib/site-settings';

/**
 * Stripped-back header and footer used while the pre-launch gate is on.
 * The normal chrome links to categories, cart and search — all gated — so it
 * would be a page full of links that bounce back to the holding page.
 */
export function ComingSoonHeader() {
  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="container-page flex items-center justify-between py-4">
        <Link href="/" className="wordmark whitespace-nowrap font-display font-extrabold tracking-tight">
          <span className="text-brand">SERVER</span>
          <span className="text-ink dark:text-white">FACTORY</span>
        </Link>
        <Link
          href="/about"
          className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          About
        </Link>
      </div>
    </header>
  );
}

export async function ComingSoonFooter() {
  const contact = await getContactSettings();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container-page py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-ink-muted dark:text-gray-400 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 transition-colors hover:text-brand">
              <Mail className="h-4 w-4 flex-shrink-0 text-brand" />
              <span className="break-all">{contact.email}</span>
            </a>
            <a href={telHref(contact.phone)} className="flex items-center gap-2 transition-colors hover:text-brand">
              <Phone className="h-4 w-4 flex-shrink-0 text-brand" /> {contact.phone}
            </a>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} ServerFactory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
