import { upload } from "@vercel/blob/client";

import { API_URL, apiFetch } from "@/lib/api";

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
};

/**
 * Whether uploads live in Vercel Blob (production). Blob uploads go straight
 * from the browser to the store, since Vercel caps API request bodies at
 * ~4.5 MB — far less than an ordinary photo.
 */
let blobMode: boolean | null = null;

async function usesBlob(): Promise<boolean> {
  if (blobMode === null) {
    try {
      blobMode = (await apiFetch<{ blob: boolean }>("/media/config")).blob;
    } catch {
      blobMode = false;
    }
  }
  return blobMode;
}

/** Uploads either directly to Blob (production) or through the API (dev). */
async function send(
  file: File,
  folder: "uploads" | "dokumenter",
  filename: string,
): Promise<{ url: string }> {
  if (await usesBlob()) {
    const blob = await upload(`${folder}/${filename}`, file, {
      access: "public",
      handleUploadUrl: `${API_URL}/media/client-upload`,
    });
    return { url: blob.url };
  }

  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `${API_URL}/media/upload${folder === "dokumenter" ? "?kind=document" : ""}`,
    { method: "POST", body: form },
  );

  if (!response.ok) {
    throw new Error(`Opplasting feilet (${response.status})`);
  }

  return (await response.json()) as { url: string };
}

function extension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** Keeps the original name readable in the browser's download bar. */
function documentFilename(originalname: string): string {
  const ext = extension(originalname);
  const base = originalname
    .slice(0, -ext.length || undefined)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "dokument"}-${crypto.randomUUID().slice(0, 8)}${ext}`;
}

/** Reads the intrinsic size of an already-hosted image by loading it. */
export function readDimensionsFromUrl(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

/** Reads the intrinsic size in the browser so the server needs no image library. */
async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

/** Uploads a PDF and returns its public path under /dokumenter. */
export function uploadDocument(file: File): Promise<{ url: string }> {
  return send(file, "dokumenter", documentFilename(file.name));
}

/** Deletes an uploaded file from the server (disk locally, Blob in prod). */
export function deleteMedia(url: string) {
  return apiFetch<{ ok: true }>("/media", {
    method: "DELETE",
    searchParams: { url },
  });
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const [{ url }, dimensions] = await Promise.all([
    send(file, "uploads", `${crypto.randomUUID()}${extension(file.name)}`),
    readDimensions(file),
  ]);

  return { url, ...dimensions };
}
