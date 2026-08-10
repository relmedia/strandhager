// Images are stored in the public web app, so relative paths resolve against it.
export const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export function mediaUrl(src: string): string {
  return src.startsWith("/") ? `${WEB_URL}${src}` : src;
}
