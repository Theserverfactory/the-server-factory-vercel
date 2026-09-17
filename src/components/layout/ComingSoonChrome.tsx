import Link from 'next/link';

/**
 * Stripped-back header and footer used while the pre-launch gate is on.
 * The normal chrome links to categories, cart and search — all gated — so it
 * would be a page full of links that bounce back to the holding page.
 *
 * Both are deliberately bare: a wordmark above, a copyright line below, and
 * nothing else competing with the holding page itself.
 */
export function ComingSoonHeader() {
  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="container-page flex items-center py-4">
        <Link href="/" className="wordmark whitespace-nowrap font-display font-extrabold tracking-tight">
          <span className="text-brand">SERVER</span>
          <span className="text-ink dark:text-white">FACTORY</span>
        </Link>
      </div>
    </header>
  );
}

export function ComingSoonFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container-page py-8">
        <p className="text-center text-xs text-ink-muted dark:text-gray-400">
          © {new Date().getFullYear()} ServerFactory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
