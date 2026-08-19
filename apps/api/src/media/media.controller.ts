import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Query,
  ServiceUnavailableException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { del, list, put } from '@vercel/blob';

// In local development media lives in the public web app so Next.js serves
// it directly. In production the API has no shared disk, so files go to
// Vercel Blob instead (enabled by BLOB_READ_WRITE_TOKEN).
const PUBLIC_DIR =
  process.env.WEB_PUBLIC_DIR ?? resolve(process.cwd(), '../web/public');
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(PUBLIC_DIR, 'uploads');
const DOCUMENTS_DIR = join(PUBLIC_DIR, 'dokumenter');

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const ALLOWED_DOCUMENTS = new Set(['.pdf']);

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
};

const isDocument = (req: { query?: Record<string, unknown> }) =>
  req.query?.kind === 'document';

/** Keeps the original name readable in the browser's download bar. */
function documentFilename(originalname: string): string {
  const ext = extname(originalname).toLowerCase();
  const base = originalname
    .slice(0, -ext.length || undefined)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[æå]/g, 'a')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${base || 'dokument'}-${randomUUID().slice(0, 8)}${ext}`;
}

/** Folders the admin may browse, mapped to their locations under public/. */
const LIBRARY_FOLDERS: Record<string, string[]> = {
  alle: ['images/galleri', 'uploads'],
  galleri: ['images/galleri'],
  images: ['images'],
  uploads: ['uploads'],
};

type LibraryFile = {
  url: string;
  name: string;
  size: number;
};

@Controller('media')
export class MediaController {
  /** Lists images already stored so the admin can re-add removed ones. */
  @Get('library')
  async library(@Query('folder') folder = 'alle'): Promise<{ files: LibraryFile[] }> {
    const folders = LIBRARY_FOLDERS[folder];

    if (!folders) {
      throw new BadRequestException(
        `Unknown folder "${folder}". Allowed: ${Object.keys(LIBRARY_FOLDERS).join(', ')}`,
      );
    }

    const files = folders.flatMap((relative) => {
      const dir = join(PUBLIC_DIR, relative);
      if (!existsSync(dir)) {
        return [];
      }

      return readdirSync(dir)
        .filter((name) => ALLOWED.has(extname(name).toLowerCase()))
        .filter((name) => statSync(join(dir, name)).isFile())
        .map((name) => ({
          url: `/${relative}/${name}`,
          name,
          size: statSync(join(dir, name)).size,
        }));
    });

    // Blob uploads show up under "uploads" (and thereby "alle").
    if (useBlob() && folders.includes('uploads')) {
      const { blobs } = await list({ prefix: 'uploads/' });
      for (const blob of blobs) {
        const name = basename(blob.pathname);
        if (!ALLOWED.has(extname(name).toLowerCase())) continue;
        files.push({ url: blob.url, name, size: blob.size });
      }
    }

    files.sort((a, b) => a.name.localeCompare(b.name, 'nb'));

    return { files };
  }

  /** Accepts images by default, or PDFs when called with ?kind=document. */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowed = isDocument(req) ? ALLOWED_DOCUMENTS : ALLOWED;
        cb(null, allowed.has(ext));
      },
    }),
  )
  async upload(
    @UploadedFile() file?: Express.Multer.File,
    @Query('kind') kind?: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException(
        kind === 'document'
          ? 'No file received. Allowed type: pdf (max 25 MB).'
          : 'No file received. Allowed types: jpg, jpeg, png, webp, avif (max 25 MB).',
      );
    }

    const document = kind === 'document';
    const ext = extname(file.originalname).toLowerCase();
    const filename = document
      ? documentFilename(file.originalname)
      : `${randomUUID()}${ext}`;
    const folder = document ? 'dokumenter' : 'uploads';

    if (useBlob()) {
      const blob = await put(`${folder}/${filename}`, file.buffer, {
        access: 'public',
        contentType: CONTENT_TYPES[ext],
        addRandomSuffix: false,
      });
      return { url: blob.url };
    }

    // On Vercel there is no writable disk, so a missing token is a setup
    // error — say so plainly instead of crashing on mkdir.
    if (process.env.VERCEL) {
      throw new ServiceUnavailableException(
        'Opplasting er ikke konfigurert: BLOB_READ_WRITE_TOKEN mangler. ' +
          'Koble Blob-lageret til API-prosjektet under Storage i Vercel, og deploy på nytt.',
      );
    }

    const dir = document ? DOCUMENTS_DIR : UPLOADS_DIR;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(join(dir, filename), file.buffer);

    return { url: `/${folder}/${filename}` };
  }

  /**
   * Deletes a stored file: a Blob URL in production, or any file under the
   * web app's public folder locally (uploads, dokumenter and repo images).
   */
  @Delete()
  async remove(@Query('url') url?: string): Promise<{ ok: true }> {
    if (!url) {
      throw new BadRequestException('Oppgi url-parameteren til filen som skal slettes');
    }

    // Blob uploads carry their full https URL.
    if (/^https:\/\//.test(url)) {
      const parsed = new URL(url);
      const deletable =
        parsed.hostname.endsWith('.public.blob.vercel-storage.com') &&
        /^\/(uploads|dokumenter)\//.test(parsed.pathname);

      if (!deletable || !useBlob()) {
        throw new BadRequestException('Denne filen kan ikke slettes herfra');
      }

      await del(url);
      return { ok: true };
    }

    // Local files: any path under the known public folders, as long as no
    // segment can climb out of them and the extension is one we manage.
    const relative = url.replace(/^\//, '');
    const segments = relative.split('/');
    const ext = extname(relative).toLowerCase();

    const valid =
      ['images', 'uploads', 'dokumenter'].includes(segments[0]) &&
      segments.every(
        (segment) =>
          segment && segment !== '.' && segment !== '..' && !segment.includes('\\'),
      ) &&
      (ALLOWED.has(ext) || ALLOWED_DOCUMENTS.has(ext));

    if (!valid) {
      throw new BadRequestException('Denne filen kan ikke slettes herfra');
    }

    const file = join(PUBLIC_DIR, ...segments);
    if (!existsSync(file)) {
      throw new NotFoundException('Fant ikke filen. Den kan allerede være slettet.');
    }

    unlinkSync(file);
    return { ok: true };
  }
}
