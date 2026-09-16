import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Server, Shield, Truck, Users } from 'lucide-react';
import { isComingSoon } from '@/lib/coming-soon';
import { getContactSettings } from '@/lib/site-settings';
import { PhotoBackdrop } from '@/components/layout/PhotoBackdrop';

export const metadata: Metadata = {
  title: 'About ServerFactory — Enterprise Server Specialists in India',
  description:
    'ServerFactory is India\'s configurator-first marketplace for enterprise servers, GPU workstations, and data-center components from Dell, HP, Lenovo, and NVIDIA.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const comingSoon = isComingSoon();
  const contact = await getContactSettings();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      {/*
        Full-bleed band: the negative margins cancel the page shell's padding so
        the photo runs edge to edge, then the padding is re-applied inside.

        Backdrop is scoped to this header rather than the whole page — the body
        below is dense text, and a photo behind all of it would cost readability
        for no benefit.
      */}
      <div className="relative -mx-4 -mt-10 px-4 pb-16 pt-14 sm:-mx-6 sm:px-6 md:-mt-16 md:pb-24 md:pt-24 lg:-mx-8 lg:px-8">
        <PhotoBackdrop variant="header" priority />
        <div className="relative text-center">
          <h1 className="heading-hero font-display font-extrabold">
            About <span className="text-brand">ServerFactory</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted sm:mt-6 sm:text-lg">
            We build India&apos;s most transparent marketplace for enterprise hardware — Dell, HP, Lenovo, NVIDIA and more,
            with fully customisable configurations and honest pricing.
          </p>
        </div>
      </div>

      <section className="mt-12 grid gap-8 md:mt-20 md:grid-cols-2">
        <div>
          <h2 className="heading-section font-display font-bold">Our mission</h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Buying enterprise servers shouldn&apos;t require a week of phone calls and three sales-rep follow-ups.
            ServerFactory puts the configurator online — pick your CPU, RAM, storage, OS and add-ons, see the real price,
            and order in minutes. We ship across India with fast delivery and pre-sales engineering support.
          </p>
        </div>
        <div>
          <h2 className="heading-section font-display font-bold">What we sell</h2>
          <ul className="mt-4 space-y-2 text-ink-muted">
            {[
              'Rack servers (Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem)',
              'GPU servers for AI & machine learning',
              'Storage & backup servers',
              'Dell Precision, HP Z, Lenovo ThinkStation workstations',
              'CPUs, ECC memory, enterprise SSDs',
              'Monthly hardware rentals',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-4 xs:grid-cols-2 md:mt-24 md:grid-cols-4 md:gap-6">
        {[
          { icon: Server, title: 'Configurator-first', desc: 'Build your exact server online — no quotes required.' },
          { icon: Shield, title: 'Warranty included', desc: 'OEM warranty + optional extended support.' },
          { icon: Truck, title: 'Pan-India delivery', desc: 'Fast dispatch from Bengaluru across all states.' },
          { icon: Users, title: 'Engineer support', desc: 'Free pre-sales consultation for demanding workloads.' },
        ].map((v) => (
          <div key={v.title} className="card p-4 text-center sm:p-6">
            <v.icon className="mx-auto h-8 w-8 text-brand sm:h-10 sm:w-10" />
            <h3 className="mt-3 font-display text-sm font-bold sm:mt-4 sm:text-base">{v.title}</h3>
            <p className="mt-2 text-xs text-ink-muted sm:text-sm">{v.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 px-5 py-10 text-center text-white shadow-brand sm:rounded-3xl sm:px-8 sm:py-12 md:mt-24 md:px-16 md:py-16">
        <h2 className="heading-section font-display font-extrabold">
          {comingSoon ? 'Want to talk before we launch?' : 'Ready to build your server?'}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
          {comingSoon
            ? 'The store opens shortly. In the meantime our engineers are happy to spec a machine for your workload.'
            : 'Start configuring from 60+ enterprise models, or talk to an engineer for custom requirements.'}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 xs:flex-row xs:flex-wrap sm:mt-8">
          {/* Pre-launch both the catalogue and /contact are gated, so point at
              email instead of buttons that would bounce to the holding page. */}
          {comingSoon ? (
            <a href={`mailto:${contact.email}`} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-700 transition hover:scale-105 sm:px-8 sm:text-base">
              Email us
            </a>
          ) : (
            <>
              <Link href="/category/servers" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-700 transition hover:scale-105 sm:px-8 sm:text-base">
                Shop Servers
              </Link>
              <Link href="/contact" className="rounded-full border-2 border-white px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-brand-700 sm:px-8 sm:text-base">
                Talk to an engineer
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
