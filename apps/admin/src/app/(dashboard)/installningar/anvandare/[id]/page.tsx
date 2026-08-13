import { notFound } from "next/navigation";

import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { TwoFactorCard } from "@/components/settings/two-factor-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatShortDate } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { getSession, listAdminUsers } from "@/server/auth-actions";

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, users] = await Promise.all([getSession(), listAdminUsers()]);

  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    notFound();
  }

  const isSelf = session?.id === user.id;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 rounded-lg">
          <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-2xl tracking-tight">{user.name}</h1>
          <p className="truncate text-muted-foreground text-sm">
            {user.email} · Bruker siden {formatShortDate(user.createdAt.slice(0, 10))}
          </p>
        </div>
      </div>

      {isSelf ? (
        <>
          <ChangePasswordCard />
          <TwoFactorCard enabled={user.twoFactorEnabled} />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Passord og innloggingsinnstillinger er personlige — hver bruker endrer sine egne
          fra sin konto.
        </p>
      )}
    </div>
  );
}
