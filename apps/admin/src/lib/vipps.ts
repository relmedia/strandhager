import { apiFetch } from "@/lib/api";
import type { VippsSettings, VippsSettingsUpdate } from "@/types/vipps";

export function getVippsSettings() {
  return apiFetch<VippsSettings>("/payments/vipps/settings");
}

export function updateVippsSettings(patch: VippsSettingsUpdate) {
  return apiFetch<VippsSettings>("/payments/vipps/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function testVippsConnection() {
  return apiFetch<{ ok: boolean; message: string }>("/payments/vipps/test", { method: "POST" });
}

export function registerVippsWebhook() {
  return apiFetch<VippsSettings>("/payments/vipps/webhook/register", { method: "POST" });
}
