/** The dashboard's view of the mail setup. The key itself stays on the server. */
export type MailSettings = {
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  notifyEmail: string | null;
  hasApiKey: boolean;
  /** The last characters of the stored key, e.g. "…a3f9". */
  apiKeyHint: string | null;
};

export type MailSettingsUpdate = {
  enabled?: boolean;
  /** Only sent when a new key was typed in. */
  apiKey?: string;
  fromName?: string;
  fromEmail?: string;
  notifyEmail?: string;
};

export type ContactStatus = "NEW" | "HANDLED";

/** A message sent through the contact form on the website. */
export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
};
