import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { destroyImage, isCloudinaryConfigured } from '@/lib/cloudinary';

const schema = z.object({
  sku: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().optional(),
  stock: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        publicId: z.string().nullable().optional(),
        alt: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { images, ...data } = parsed.data;
    const product = await prisma.product.update({ where: { id: params.id }, data });

    // `images` is the complete desired set, in display order. Replace the
    // stored rows and destroy any Cloudinary file that's no longer referenced.
    if (images) {
      const existing = await prisma.productImage.findMany({ where: { productId: params.id } });
      const keptPublicIds = new Set(images.map((i) => i.publicId).filter(Boolean));

      const orphaned = existing.filter((e) => e.publicId && !keptPublicIds.has(e.publicId));

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: params.id } }),
        prisma.productImage.createMany({
          data: images.map((img, i) => ({
            productId: params.id,
            url: img.url,
            publicId: img.publicId ?? null,
            alt: img.alt || null,
            sortOrder: i,
          })),
        }),
      ]);

      // After the DB is consistent — a failure here leaves a stray file, which
      // is recoverable; failing before the commit would leave a broken image.
      if (isCloudinaryConfigured()) {
        for (const img of orphaned) {
          await destroyImage(img.publicId as string).catch((e) =>
            console.error(`Failed to delete Cloudinary asset ${img.publicId}:`, e)
          );
        }
      }
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    // Safe delete - product is referenced by order items
    // Soft delete: just mark inactive
    await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Cannot delete — product may be referenced by orders' }, { status: 500 });
  }
}
