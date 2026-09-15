import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { isComingSoon } from '@/lib/coming-soon';
import { ComingSoon } from '@/components/home/ComingSoon';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBanner } from '@/components/home/PromoBanner';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { BrandLogos } from '@/components/home/BrandLogos';
import { CtaBlock } from '@/components/home/CtaBlock';

export const revalidate = 60; // ISR - refresh homepage every minute

/**
 * The root layout's metadata describes a working store. While gated, the
 * holding page gets its own copy — still indexable and brand-forward, so the
 * domain starts building a SERP presence before launch.
 */
export function generateMetadata(): Metadata {
  if (!isComingSoon()) return {};
  return {
    title: 'ServerFactory — Launching Soon',
    description:
      'ServerFactory is launching soon: enterprise servers, GPU workstations and data-centre components from Dell, HPE, HP and Lenovo, configurable online.',
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
    openGraph: {
      title: 'ServerFactory — Launching Soon',
      description: 'Enterprise servers, workstations and components. Launching soon.',
    },
  };
}

export default async function HomePage() {
  if (isComingSoon()) return <ComingSoon />;

  const blocks = await prisma.landingBlock
    .findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } })
    .catch(() => []);

  return (
    <div>
      {blocks.map((block) => {
        const data = block.data as any;
        const inner = (() => {
          switch (block.type) {
            case 'HERO_CAROUSEL':    return <HeroCarousel slides={data.slides ?? []} />;
            case 'PROMO_BANNER':     return <PromoBanner text={data.text} link={data.link} bgColor={data.bgColor} />;
            case 'FEATURED_PRODUCTS': return <FeaturedProducts heading={data.heading} limit={data.limit ?? 8} />;
            case 'CATEGORY_GRID':    return <CategoryGrid heading={data.heading} />;
            case 'BRAND_LOGOS':      return <BrandLogos heading={data.heading} brands={data.brands ?? []} />;
            case 'CTA':              return <CtaBlock {...data} />;
            default:                 return null;
          }
        })();
        if (!inner) return null;
        return (
          <div key={block.id} style={data.sectionBg ? { backgroundColor: data.sectionBg } : undefined}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
