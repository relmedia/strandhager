import { AdminUsersTable } from "@/components/settings/admin-users-table";
import { InviteAdminDialog } from "@/components/settings/invite-admin-dialog";
import { getSession, listAdminUsers } from "@/server/auth-actions";

export default async function Page() {
  const [session, users] = await Promise.all([getSession(), listAdminUsers()]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Brukere</h1>
        <p className="text-muted-foreground text-sm">
          Alle som kan logge inn på dashbordet. Nye brukere får et midlertidig passord
          på e-post og velger sitt eget ved første innlogging.
        </p>
      </div>

      <AdminUsersTable users={users} currentUserId={session?.id} actions={<InviteAdminDialog />} />
    </div>
  );
}
