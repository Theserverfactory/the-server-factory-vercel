import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import {
  CONFIGURATOR_SETTINGS_KEY,
  CONTACT_SETTINGS_KEY,
  SETTINGS_CACHE_TAG,
} from '@/lib/site-settings';

const schema = z.object({
  configurator: z
    .object({
      hideSpecLabels: z.boolean(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(120),
      phone: z.string().trim().min(1, 'Phone is required').max(40),
      address: z.string().trim().min(1, 'Address is required').max(300),
    })
    .optional(),
});

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { configurator, contact } = parsed.data;

    // Reads are wrapped in unstable_cache, so the stored row changing is not
    // enough on its own — the cache entry has to be dropped too.
    const purgeCache = () => revalidateTag(SETTINGS_CACHE_TAG);

    if (configurator) {
      await prisma.siteSetting.upsert({
        where: { key: CONFIGURATOR_SETTINGS_KEY },
        update: { value: configurator },
        create: { key: CONFIGURATOR_SETTINGS_KEY, value: configurator },
      });
      purgeCache();
      // Product pages are ISR'd (revalidate = 300), so without this the change
      // would take up to five minutes to appear.
      revalidatePath('/product/[slug]', 'page');
    }

    if (contact) {
      // Merge rather than replace: the seed may have written keys this form
      // doesn't manage, and a blind overwrite would silently drop them.
      const existing = await prisma.siteSetting.findUnique({
        where: { key: CONTACT_SETTINGS_KEY },
      });
      const merged = {
        ...((existing?.value as Record<string, unknown>) ?? {}),
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
      };

      await prisma.siteSetting.upsert({
        where: { key: CONTACT_SETTINGS_KEY },
        update: { value: merged },
        create: { key: CONTACT_SETTINGS_KEY, value: merged },
      });
      purgeCache();
      // The footer sits in the root layout, so these details appear on every
      // page — including fully static ones that would otherwise never refresh.
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ configurator, contact });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
