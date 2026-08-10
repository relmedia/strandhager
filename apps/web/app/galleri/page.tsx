import { notFound, redirect } from "next/navigation";

import { getGalleries } from "@/lib/get-site-content";

/** /galleri has no content of its own — send visitors to the first gallery. */
export default async function GalleriIndexPage() {
  const galleries = await getGalleries();
  const first = galleries.find((gallery) => gallery.images.length > 0) ?? galleries[0];

  if (!first) {
    notFound();
  }

  redirect(`/galleri/${first.slug}`);
}
