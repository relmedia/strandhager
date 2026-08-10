/** Mirrors what the parcel API returns. */

/** Derived by the API from whether anyone owns the plot. */
export type ParcelStatus = "OWNED" | "VACANT" | "UNAVAILABLE";

export type ParcelOwner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

export type Parcel = {
  id: string;
  number: number;
  size: number | null;
  notes: string | null;
  available: boolean;
  status: ParcelStatus;
  owner: ParcelOwner | null;
  updatedAt: string;
};

export type ParcelUpdate = {
  number?: number;
  size?: number;
  notes?: string;
  available?: boolean;
  /** Null frees the plot up. */
  ownerId?: string | null;
};

export type Parcellant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  parcels: { id: string; number: number }[];
  /** Every plot they have owned, newest first, including the one they own now. */
  history: {
    id: string;
    parcel: { id: string; number: number };
    startedAt: string;
    endedAt: string | null;
  }[];
  createdAt: string;
};

export type ParcellantInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
};

/** One spell of somebody owning a plot. An open one has no end date. */
export type Ownership = {
  id: string;
  parcelId: string;
  parcellant: ParcelOwner;
  /** YYYY-MM-DD. */
  startedAt: string;
  /** YYYY-MM-DD, or null while they still own it. */
  endedAt: string | null;
  notes: string | null;
};

/** The same spell seen from the owner's side, so the plot comes with it. */
export type ParcellantOwnership = Ownership & {
  parcel: { id: string; number: number };
};

export type OwnershipInput = {
  parcellantId: string;
  startedAt: string;
  endedAt?: string | null;
  notes?: string;
};

export type OwnershipUpdate = Partial<OwnershipInput>;

export type WaitlistStatus = "WAITING" | "OFFERED" | "ACCEPTED" | "DECLINED";

/** Whether they signed up on the website themselves, or the board added them. */
export type WaitlistSource = "WEBSITE" | "ADMIN";

export type WaitlistEntry = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string | null;
  notes: string | null;
  status: WaitlistStatus;
  source: WaitlistSource;
  offeredAt: string | null;
  createdAt: string;
  /** Place in the queue, only for those still waiting. */
  position: number | null;
};

export type WaitlistInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  notes?: string;
};

export type WaitlistUpdate = Partial<WaitlistInput> & { status?: WaitlistStatus };
