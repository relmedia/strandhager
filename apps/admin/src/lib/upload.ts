import { API_URL } from "@/lib/api";

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
};

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
export async function uploadDocument(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_URL}/media/upload?kind=document`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Opplasting feilet (${response.status})`);
  }

  return (await response.json()) as { url: string };
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);

  const [response, dimensions] = await Promise.all([
    fetch(`${API_URL}/media/upload`, { method: "POST", body: form }),
    readDimensions(file),
  ]);

  if (!response.ok) {
    throw new Error(`Opplasting feilet (${response.status})`);
  }

  const { url } = (await response.json()) as { url: string };
  return { url, ...dimensions };
}
