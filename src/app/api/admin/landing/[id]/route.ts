import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { collectPublicIds, destroyImage, isCloudinaryConfigured } from '@/lib/cloudinary';

/** Destroys Cloudinary files that the block no longer references. */
async function cleanupOrphans(previous: unknown, next: unknown) {
  if (!isCloudinaryConfigured()) return;
  const kept = new Set(collectPublicIds(next));
  const orphaned = collectPublicIds(previous).filter((id) => !kept.has(id));
  for (const id of orphaned) {
    await destroyImage(id).catch((e) => console.error(`Failed to delete Cloudinary asset ${id}:`, e));
  }
}

const patchSchema = z.object({
  title: z.string().nullable().optional(),
  data: z.any().optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    // Capture the old payload before overwriting so removed images can be cleaned up.
    const previous = parsed.data.data !== undefined
      ? await prisma.landingBlock.findUnique({ where: { id: params.id }, select: { data: true } })
      : null;

    const block = await prisma.landingBlock.update({ where: { id: params.id }, data: parsed.data });

    if (previous) await cleanupOrphans(previous.data, parsed.data.data);

    return NextResponse.json({ block });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  try {
    const block = await prisma.landingBlock.findUnique({ where: { id: params.id }, select: { data: true } });
    await prisma.landingBlock.delete({ where: { id: params.id } });
    // Nothing references these any more once the block is gone.
    if (block) await cleanupOrphans(block.data, null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
