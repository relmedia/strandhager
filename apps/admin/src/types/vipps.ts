type Source = "db" | "env" | null;

/** The dashboard's view of the Vipps setup. The secrets stay on the server. */
export type VippsSettings = {
  enabled: boolean;
  production: boolean;
  clientId: string | null;
  merchantSerial: string | null;
  /** The last characters of each stored secret, e.g. "…a3f9". */
  clientSecretHint: string | null;
  subscriptionKeyHint: string | null;
  /** Where each value comes from: saved here, or the server's .env. */
  sources: {
    clientId: Source;
    merchantSerial: Source;
    clientSecret: Source;
    subscriptionKey: Source;
  };
  /** All four keys are present. */
  complete: boolean;
  /** Bookings are getting pay links right now. */
  active: boolean;
  /** VIPPS_MOCK is on: every Vipps call is pretended. */
  mock: boolean;
  webhook: {
    registered: boolean;
    url: string | null;
    /** A signing secret is set in .env rather than registered from here. */
    manualSecret: boolean;
  };
};

export type VippsSettingsUpdate = {
  enabled?: boolean;
  production?: boolean;
  clientId?: string;
  merchantSerial?: string;
  /** Only sent when a new value was typed in. */
  clientSecret?: string;
  subscriptionKey?: string;
};
