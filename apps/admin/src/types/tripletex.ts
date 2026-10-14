/** The dashboard's view of the Tripletex connection. The tokens stay on the server. */
export type TripletexSettings = {
  enabled: boolean;
  production: boolean;
  /** The last characters of each stored token, e.g. "…a3f9". */
  consumerTokenHint: string | null;
  employeeTokenHint: string | null;
  /** Both tokens are present. */
  complete: boolean;
  vatTypeId: number | null;
  paymentTypeId: number | null;
  sendInvoice: boolean;
  dueDays: number;
};

export type TripletexSettingsUpdate = {
  enabled?: boolean;
  production?: boolean;
  /** Only sent when a new value was typed in. */
  consumerToken?: string;
  employeeToken?: string;
  vatTypeId?: number | null;
  paymentTypeId?: number | null;
  sendInvoice?: boolean;
  dueDays?: number;
};

export type TripletexOption = { id: number; label: string };

export type TripletexOptions = {
  ok: boolean;
  message?: string;
  vatTypes: TripletexOption[];
  paymentTypes: TripletexOption[];
};
