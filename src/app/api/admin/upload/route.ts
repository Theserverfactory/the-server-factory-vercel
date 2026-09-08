import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import {
  CLOUDINARY_FOLDERS,
  destroyImage,
  isCloudinaryConfigured,
  signUpload,
} from '@/lib/cloudinary';

const signSchema = z.object({
  folder: z.enum(['products', 'landing']),
});

const deleteSchema = z.object({
  publicId: z.string().min(1),
});

/** Issues a short-lived signature so the browser can upload straight to Cloudinary. */
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' },
      { status: 503 }
    );
  }

  try {
    const parsed = signSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json(signUpload(CLOUDINARY_FOLDERS[parsed.data.folder]));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Could not sign upload' }, { status: 500 });
  }
}

/**
 * Deletes a file from Cloudinary. Used for images removed before they were ever
 * attached to a record — images on saved records are cleaned up by the product
 * save handler instead, so a discarded edit can't orphan a live image.
 */
export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Cloudinary is not configured.' }, { status: 503 });
  }

  try {
    const parsed = deleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const deleted = await destroyImage(parsed.data.publicId);
    return NextResponse.json({ deleted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Could not delete image' }, { status: 500 });
  }
}
