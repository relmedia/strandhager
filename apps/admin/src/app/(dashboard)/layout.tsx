import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AccountSwitcher } from "@/components/layout/account-switcher";
import { Header } from "@/components/layout/header";
import { LayoutControls } from "@/components/layout/layout-controls";
import { SearchDialog } from "@/components/layout/search-dialog";
import { AppSidebar } from "@/components/layout/sidebar";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AUTH_LOGIN_PATH } from "@/lib/auth";
import { isAllowedEmail } from "@/lib/auth/allowlist";
import { SIDEBAR_COLLAPSIBLE_VALUES, SIDEBAR_VARIANT_VALUES } from "@/lib/preferences/layout";
import { cn } from "@/lib/utils";
import { getSession } from "@/server/auth-actions";
import { getPreference } from "@/server/server-actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect(AUTH_LOGIN_PATH);
  }

  if (!isAllowedEmail(session.email)) {
    redirect("/api/no-access");
  }

  // Invited users must swap the temporary password before using the dashboard.
  if (session.mustChangePassword) {
    redirect("/bytt-passord");
  }

  const currentUser = {
    id: session.id,
    name: session.name || session.email.split("@")[0] || "Bruker",
    email: session.email,
    avatar: "",
    role: "Administrator",
  };

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
  ]);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant={variant} collapsible={collapsible} />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "[--dashboard-header-height:--spacing(12)]",
          // On paper only the page content should remain, without the app frame.
          "print:m-0! print:rounded-none! print:border-none! print:shadow-none!",
        )}
      >
        <Header
          left={
            <>
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </>
          }
          right={
            <>
              <LayoutControls />
              <ThemeSwitcher />
              <AccountSwitcher users={[currentUser]} />
            </>
          }
        />
        <div className="h-full p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0 print:p-0!">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
