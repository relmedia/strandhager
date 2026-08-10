const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type WaitlistSignup = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
};

/** Error carrying the message the API wrote, which is already in Norwegian. */
export class WaitlistError extends Error {}

/** Their place in the queue, which is all the site is told about the list. */
export async function joinWaitlist(
  payload: WaitlistSignup,
): Promise<{ position: number; firstName: string }> {
  const response = await fetch(`${API_URL}/waitlist/signup`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new WaitlistError(readError(body));
  }

  return body as { position: number; firstName: string };
}

/** Nest reports validation failures as an array of messages. */
function readError(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }
  return "Noe gikk galt. Prøv igjen om litt.";
}
