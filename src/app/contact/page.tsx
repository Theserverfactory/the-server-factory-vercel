import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { getContactSettings, telHref } from '@/lib/site-settings';

export const metadata: Metadata = {
  title: 'Contact ServerFactory — Get in touch',
  description: 'Contact our sales team for enterprise server quotes, custom configurations, or pre-sales engineering support.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const contact = await getContactSettings();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      <div className="text-center">
        <h1 className="heading-page font-display font-extrabold">
          Get in <span className="text-brand">touch</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-ink-muted sm:text-base">
          Our engineers and sales team are here to help — whether you need a quote, a custom configuration, or infrastructure advice.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:mt-16 md:gap-10 lg:grid-cols-[1fr_1.5fr]">
        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-6">
          <InfoCard icon={Mail} title="Email" value={contact.email} href={`mailto:${contact.email}`} />
          <InfoCard icon={Phone} title="Phone" value={contact.phone} href={telHref(contact.phone)} />
          <InfoCard icon={MapPin} title="Address" value={contact.address} />
          <InfoCard icon={Clock} title="Hours" value="Mon – Sat, 9:30 AM – 7:00 PM IST" />
        </aside>

        <div className="card p-5 sm:p-6 md:p-8">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Send us a message</h2>
          <p className="mt-1 text-sm text-ink-muted">We typically respond within 4 business hours.</p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value, href }: { icon: any; title: string; value: string; href?: string }) {
  const content = (
    <div className="card flex h-full items-start gap-3 p-4 transition hover:border-brand sm:gap-4 sm:p-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand/15">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</p>
        <p className="mt-1 whitespace-pre-line break-words text-sm font-semibold text-ink dark:text-gray-100 sm:text-base">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="block h-full">{content}</a> : content;
}
