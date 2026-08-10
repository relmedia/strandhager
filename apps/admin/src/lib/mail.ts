import { apiFetch } from "@/lib/api";
import type {
  ContactMessage,
  ContactStatus,
  MailSettings,
  MailSettingsUpdate,
} from "@/types/mail";

export function getMailSettings() {
  return apiFetch<MailSettings>("/notifications/settings");
}

export function updateMailSettings(patch: MailSettingsUpdate) {
  return apiFetch<MailSettings>("/notifications/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function sendTestEmail(to: string) {
  return apiFetch<{ sent: boolean; id: string }>("/notifications/test", {
    method: "POST",
    body: JSON.stringify({ to }),
  });
}

export function listContactMessages() {
  return apiFetch<ContactMessage[]>("/contact");
}

export function updateContactMessage(id: string, patch: { status: ContactStatus }) {
  return apiFetch<ContactMessage>(`/contact/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteContactMessage(id: string) {
  return apiFetch<{ id: string }>(`/contact/${id}`, { method: "DELETE" });
}
