import { PrismaClient, BlockType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';
import { join } from 'path';
import { categories, products } from './inventory-data';

const prisma = new PrismaClient();

// Not a column in the source sheet. Seeded in stock so the catalogue is
// orderable; adjust per-product in Admin → Products.
const DEFAULT_STOCK = 10;

/**
 * The sheet names an image file per product (e.g. "/images/dell-r760.jpg") but
 * those files aren't in the repo. Attaching them regardless would render broken
 * images across a live catalogue, so only attach what actually exists on disk.
 */
function resolveImage(imageFile: string | null): string | null {
  if (!imageFile) return null;
  const onDisk = join(process.cwd(), 'public', imageFile.replace(/^\//, ''));
  return existsSync(onDisk) ? imageFile : null;
}

async function main() {
  console.log('🌱 Seeding ServerFactory catalogue...\n');

  // ─── Admin user ──────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@theserverfactory.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash: hash },
    create: { email: adminEmail, name: 'Admin', passwordHash: hash, role: 'ADMIN' },
  });
  console.log(`✔ Admin user: ${adminEmail}`);

  // ─── Guard: products can't be deleted while an order references them ──
  const referenced = await prisma.orderItem.count();
  if (referenced > 0) {
    throw new Error(
      `Refusing to wipe the catalogue: ${referenced} order item(s) reference existing products.\n` +
      `Deleting those products would break order history.\n` +
      `Either clear orders first or seed into an empty database.`
    );
  }

  // ─── Wipe existing catalogue ─────────────
  await prisma.productTierSelection.deleteMany({});
  await prisma.productTier.deleteMany({});
  await prisma.optionValue.deleteMany({});
  await prisma.optionGroup.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.updateMany({ data: { parentId: null } }); // clear self-refs first
  await prisma.category.deleteMany({});
  console.log('✔ Existing catalogue removed');

  // ─── Categories (roots first, so every parent id exists) ──
  const catId = new Map<string, string>();
  for (const c of categories.filter((c) => c.parent === null)) {
    const row = await prisma.category.create({
      data: { slug: c.slug, name: c.name, description: c.description, sortOrder: c.sortOrder, parentId: null },
    });
    catId.set(c.slug, row.id);
  }
  for (const c of categories.filter((c) => c.parent !== null)) {
    const parentId = catId.get(c.parent as string);
    if (!parentId) throw new Error(`Category "${c.slug}" references unknown parent "${c.parent}"`);
    const row = await prisma.category.create({
      data: { slug: c.slug, name: c.name, description: c.description, sortOrder: c.sortOrder, parentId },
    });
    catId.set(c.slug, row.id);
  }
  console.log(`✔ ${categories.length} categories`);

  // ─── Products ────────────────────────────
  let groupCount = 0;
  let imageCount = 0;
  let skippedImages = 0;

  for (const p of products) {
    const categoryId = catId.get(p.categorySlug);
    if (!categoryId) throw new Error(`Product "${p.sku}" references unknown category "${p.categorySlug}"`);

    const image = resolveImage(p.imageFile);
    if (p.imageFile && !image) skippedImages++;
    if (image) imageCount++;

    const created = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        shortDesc: p.shortDesc,
        description: p.description,
        basePrice: p.basePrice,
        stock: DEFAULT_STOCK,
        isActive: true,
        isFeatured: p.isFeatured,
        categoryId,
        metaTitle: `${p.name} — Buy Online in India | ServerFactory`,
        metaDescription: p.shortDesc,
        ...(image ? { images: { create: [{ url: image, alt: p.name, sortOrder: 0 }] } } : {}),
      },
    });

    // Each spec column becomes a group holding exactly the value this product
    // ships with, at a zero delta. The sheet lists no alternatives and no
    // per-option pricing, so nothing here is invented.
    for (const g of p.groups) {
      await prisma.optionGroup.create({
        data: {
          productId: created.id,
          name: g.name,
          label: g.label,
          required: true,
          sortOrder: g.sortOrder,
          values: {
            create: [{ label: g.value, priceDelta: 0, isDefault: true, stock: DEFAULT_STOCK, sortOrder: 0 }],
          },
        },
      });
      groupCount++;
    }
  }

  console.log(`✔ ${products.length} products (${groupCount} spec groups)`);
  console.log(`  ${products.filter((p) => p.isFeatured).length} featured`);
  if (skippedImages > 0) {
    console.warn(
      `\n⚠ ${skippedImages} product image(s) named in the sheet were skipped — the files\n` +
      `  aren't in public/. Add them and re-seed, or upload via Admin → Products.`
    );
  }

  // ─── Landing page + settings ─────────────
  // Only created when absent, so existing customisations survive a re-seed.
  if ((await prisma.landingBlock.count()) === 0) {
    await prisma.landingBlock.createMany({
      data: [
        {
          type: BlockType.HERO_CAROUSEL,
          title: 'Homepage hero',
          sortOrder: 0,
          data: {
            slides: [
              {
                imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80',
                heading: 'Enterprise servers built your way',
                subheading: `Browse ${products.length} configurations from Dell, HPE, HP, Lenovo and more.`,
                ctaText: 'Shop Servers',
                ctaLink: '/category/servers',
              },
            ],
          },
        },
        { type: BlockType.FEATURED_PRODUCTS, title: 'Featured Products', sortOrder: 1, data: { heading: 'Featured ', limit: 8 } },
        { type: BlockType.CATEGORY_GRID, title: 'Shop by Category', sortOrder: 2, data: { heading: 'Shop by Category' } },
        {
          type: BlockType.BRAND_LOGOS,
          title: 'Brands',
          sortOrder: 3,
          data: { heading: 'Trusted by the best', brands: [...new Set(products.map((p) => p.brand))].sort() },
        },
        {
          type: BlockType.CTA,
          title: 'Bottom CTA',
          sortOrder: 4,
          data: {
            heading: 'Not sure what you need?',
            subheading: 'Our engineers will spec the right machine for your workload — free consultation.',
            ctaText: 'Talk to an engineer',
            ctaLink: '/contact',
          },
        },
      ],
    });
    console.log('✔ Default landing blocks created');
  } else {
    // Existing blocks may link to categories the old catalogue had and this one
    // doesn't. Surface those rather than leaving silent 404s on the homepage.
    const blocks = await prisma.landingBlock.findMany();
    const valid = new Set(categories.map((c) => c.slug));
    const broken = new Set<string>();
    for (const b of blocks) {
      for (const m of JSON.stringify(b.data).matchAll(/\/category\/([a-z0-9-]+)/g)) {
        if (!valid.has(m[1])) broken.add(m[1]);
      }
    }
    console.log(`✔ Landing blocks left as-is (${blocks.length} existing)`);
    if (broken.size > 0) {
      console.warn(
        `\n⚠ Landing blocks link to categories that no longer exist: ${[...broken].join(', ')}\n` +
        `  Update them in Admin → Landing Page, or they will 404.`
      );
    }
  }

  if (!(await prisma.siteSetting.findUnique({ where: { key: 'contact' } }))) {
    await prisma.siteSetting.create({
      data: {
        key: 'contact',
        value: {
          email: 'admin@theserverfactory.com',
          phone: '+91 80 4000 0000',
          address: 'Bengaluru, Karnataka, India',
        },
      },
    });
  }

  console.log('\n✨ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
