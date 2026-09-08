import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  brand: z.string().optional(),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  stock: z.number().int().min(0),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  categoryId: z.string(),
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

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { images, ...data } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...data,
        ...(images?.length
          ? {
              // Array order is the display order; index 0 is the primary image.
              images: {
                create: images.map((img, i) => ({
                  url: img.url,
                  publicId: img.publicId ?? null,
                  alt: img.alt || null,
                  sortOrder: i,
                })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json({ product });
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'SKU or slug already exists' }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
