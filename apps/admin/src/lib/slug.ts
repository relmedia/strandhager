/** Turns a Norwegian title into a URL-safe segment: "Parsellene i sol" -> "parsellene-i-sol". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
