import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

// Media lives in the public web app so Next.js serves it directly.
const PUBLIC_DIR =
  process.env.WEB_PUBLIC_DIR ?? resolve(process.cwd(), '../web/public');
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(PUBLIC_DIR, 'uploads');
const DOCUMENTS_DIR = join(PUBLIC_DIR, 'dokumenter');

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const ALLOWED_DOCUMENTS = new Set(['.pdf']);

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
  /** Lists image files already on disk so the admin can re-add removed ones. */
  @Get('library')
  library(@Query('folder') folder = 'alle'): { files: LibraryFile[] } {
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

    files.sort((a, b) => a.name.localeCompare(b.name, 'nb'));

    return { files };
  }

  /** Accepts images by default, or PDFs when called with ?kind=document. */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const dir = isDocument(req) ? DOCUMENTS_DIR : UPLOADS_DIR;
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          if (isDocument(req)) {
            cb(null, documentFilename(file.originalname));
            return;
          }
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowed = isDocument(req) ? ALLOWED_DOCUMENTS : ALLOWED;
        cb(null, allowed.has(ext));
      },
    }),
  )
  upload(
    @UploadedFile() file?: Express.Multer.File,
    @Query('kind') kind?: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        kind === 'document'
          ? 'No file received. Allowed type: pdf (max 25 MB).'
          : 'No file received. Allowed types: jpg, jpeg, png, webp, avif (max 25 MB).',
      );
    }

    const folder = kind === 'document' ? 'dokumenter' : 'uploads';
    return { url: `/${folder}/${file.filename}` };
  }
}
