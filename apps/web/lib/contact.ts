const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  /** What the message is about, picked from the topic list in the form. */
  subject?: string;
  message: string;
  /** Proof from the Cloudflare Turnstile widget that the sender is a person. */
  turnstileToken?: string;
};

export class ContactError extends Error {}

export async function sendContactMessage(
  payload: ContactPayload,
): Promise<{ received: boolean; name: string }> {
  const response = await fetch(`${API_URL}/contact`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ContactError(readError(body));
  }

  return body as { received: boolean; name: string };
}

function readError(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }
  return "Noe gikk galt. Prøv igjen om litt.";
}
