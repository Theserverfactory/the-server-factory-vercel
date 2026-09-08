import { PrismaClient, BlockType, TierName } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serverProducts, type SeedServerProduct } from './server-factory-data';

const prisma = new PrismaClient();

const TIER_NAMES: TierName[] = ['BASIC', 'INTERMEDIATE', 'ADVANCED'];
const TIER_LABELS: Record<TierName, string> = { BASIC: 'Basic', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

// The sheet this seed is built from has no stock figures. Seeded in stock so
// the catalogue is orderable; adjust per-product in Admin → Products.
const DEFAULT_STOCK = 10;

async function main() {
  console.log('🌱 Seeding ServerFactory database...\n');

  // ─── Admin user ──────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@serverfactory.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', passwordHash: hash },
    create: { email: adminEmail, name: 'Admin', passwordHash: hash, role: 'ADMIN' },
  });
  console.log(`✔ Admin user: ${adminEmail} / ${adminPassword}`);

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
  await prisma.category.updateMany({ data: { parentId: null } }); // clear self-refs before delete
  await prisma.category.deleteMany({});
  console.log('✔ Existing catalogue removed');

  // ─── Categories ──────────────────────────
  // Every product in this seed is a 2U rack server, so a single leaf category
  // is enough — brand ("Dell" / "HP") already differentiates via the
  // category page's brand filter.
  const serversCategory = await prisma.category.create({
    data: { slug: 'servers', name: 'Servers', description: 'Enterprise-grade rack servers', sortOrder: 0 },
  });
  const rackServersCategory = await prisma.category.create({
    data: {
      slug: 'rack-servers',
      name: 'Rack Servers',
      parentId: serversCategory.id,
      sortOrder: 0,
    },
  });
  console.log('✔ Categories seeded');

  // ─── Products ─────────────────────────────
  for (const p of serverProducts) {
    await seedProduct(p, rackServersCategory.id);
    console.log(`  ✔ ${p.name}${p.configs.length > 1 ? ` (${p.configs.length} configurations)` : ''}`);
  }
  console.log(`✔ ${serverProducts.length} products seeded — all inactive with basePrice 0 until priced in admin`);

  // ─── Landing page blocks ─────────────────
  await prisma.landingBlock.deleteMany({});
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
              heading: 'Find Your Perfect Server',
              subheading: 'Dell PowerEdge and HP ProLiant rack servers, configured for your workload.',
              ctaText: 'Shop Servers',
              ctaLink: '/category/servers',
            },
          ],
        },
      },
      {
        type: BlockType.FEATURED_PRODUCTS,
        title: 'Featured Products',
        sortOrder: 1,
        data: { heading: 'Featured Hardware', limit: 8 },
      },
      {
        type: BlockType.CATEGORY_GRID,
        title: 'Shop by Category',
        sortOrder: 2,
        data: { heading: 'Shop by Category' },
      },
      {
        type: BlockType.BRAND_LOGOS,
        title: 'Brands',
        sortOrder: 3,
        // Only brands actually in the catalogue — see seedProduct below for why.
        data: { heading: 'Trusted by the best', brands: ['Dell', 'HP'] },
      },
      {
        type: BlockType.CTA,
        title: 'Bottom CTA',
        sortOrder: 4,
        data: {
          heading: 'Not sure what you need?',
          subheading: 'Our engineers will spec the perfect server for your workload — free consultation.',
          ctaText: 'Talk to an engineer',
          ctaLink: '/contact',
        },
      },
    ],
  });

  // ─── Site settings ────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: 'contact' },
    update: {},
    create: {
      key: 'contact',
      value: {
        email: 'sales@serverfactory.com',
        phone: '+91 80 4000 0000',
        address: 'Bengaluru, Karnataka, India',
      },
    },
  });

  console.log('\n✨ Seed complete.');
}

async function seedProduct(p: SeedServerProduct, categoryId: string) {
  const facts: string[] = [];
  if (p.formFactor) facts.push(`${p.formFactor} rack server`);
  if (p.powerSupply) facts.push(p.powerSupply.toLowerCase());
  if (p.warranty) facts.push(p.warranty.toLowerCase());

  const shortDesc = facts.length > 0
    ? `${facts[0][0].toUpperCase()}${facts[0].slice(1)}${facts.length > 1 ? ` with ${facts.slice(1).join(', ')}` : ''}.`
    : `${p.brand} rack server.`;

  const description = p.configs.length > 1
    ? `The ${p.name} is available in ${p.configs.length} configurations. ${shortDesc} Choose a preset configuration below or customize your own.`
    : `${shortDesc} Configure the ${p.name} below.`;

  const product = await prisma.product.create({
    data: {
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      shortDesc,
      description,
      // No pricing in the source data — seeded inactive so nothing with a
      // fabricated price can appear on the storefront. Set a real price and
      // flip Active in Admin → Products when ready.
      basePrice: 0,
      stock: DEFAULT_STOCK,
      isActive: false,
      isFeatured: false,
      categoryId,
      metaTitle: `${p.name} — Buy Online in India | ServerFactory`,
      metaDescription: shortDesc,
    },
  });

  // One OptionGroup per spec that actually varies (or could vary) across
  // configurations: processor, memory, storage. Facts that never vary in this
  // dataset (form factor, power supply, warranty) live in the description
  // instead of as a group with a single forced "choice".
  const fieldGroups: { name: string; label: string; sortOrder: number; field: keyof import('./server-factory-data').SeedTierConfig }[] = [
    { name: 'processor', label: 'Processor', sortOrder: 0, field: 'processor' },
    { name: 'memory', label: 'Memory', sortOrder: 1, field: 'memory' },
    { name: 'storage', label: 'Storage', sortOrder: 2, field: 'storage' },
  ];

  // field -> (value label -> OptionValue id), for wiring up tier selections below
  const valueIdByField: Record<string, Map<string, string>> = {};

  for (const fg of fieldGroups) {
    const seen = new Map<string, string>(); // label -> id, insertion order = Basic..Advanced
    const distinctLabels: string[] = [];
    for (const cfg of p.configs) {
      const v = cfg[fg.field];
      if (v && !seen.has(v)) { seen.set(v, ''); distinctLabels.push(v); }
    }
    if (distinctLabels.length === 0) continue; // no product in this dataset hits this, but stay defensive

    const group = await prisma.optionGroup.create({
      data: { productId: product.id, name: fg.name, label: fg.label, required: true, sortOrder: fg.sortOrder },
    });

    const idByLabel = new Map<string, string>();
    for (const [i, label] of distinctLabels.entries()) {
      const value = await prisma.optionValue.create({
        data: { groupId: group.id, label, priceDelta: 0, isDefault: i === 0, stock: DEFAULT_STOCK, sortOrder: i },
      });
      idByLabel.set(label, value.id);
    }
    valueIdByField[fg.field] = idByLabel;
  }

  // Tiers only when the source actually gives more than one configuration —
  // a single-config product just shows its (pre-selected) spec groups.
  if (p.configs.length > 1) {
    for (const [i, cfg] of p.configs.entries()) {
      const name = TIER_NAMES[i];
      const selections = fieldGroups
        .map((fg) => cfg[fg.field] && valueIdByField[fg.field]?.get(cfg[fg.field]!))
        .filter((id): id is string => Boolean(id))
        .map((optionValueId) => ({ optionValueId }));

      await prisma.productTier.create({
        data: {
          productId: product.id,
          name,
          label: TIER_LABELS[name],
          sortOrder: i,
          // No pricing in the source — falls back to basePrice + option
          // deltas (both 0), so every tier shows the same ₹0 until priced.
          priceOverride: null,
          selections: { create: selections },
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
