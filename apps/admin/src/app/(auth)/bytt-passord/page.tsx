import Image from "next/image";

import { redirect } from "next/navigation";

import { FirstPasswordForm } from "@/components/auth/first-password-form";
import { APP_CONFIG } from "@/config/app-config";
import { AUTH_HOME_PATH, AUTH_LOGIN_PATH } from "@/lib/auth";
import { getSession } from "@/server/auth-actions";

export default async function FirstPasswordPage() {
  const session = await getSession();

  if (!session) {
    redirect(AUTH_LOGIN_PATH);
  }

  if (!session.mustChangePassword) {
    redirect(AUTH_HOME_PATH);
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-[#f7faf3] p-8">
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-4 text-center">
          <Image
            src="/images/logo.png"
            alt={APP_CONFIG.name}
            width={120}
            height={82}
            priority
            className="mx-auto h-auto w-28"
          />
          <div className="font-medium text-[#20261c] tracking-tight">Velg ditt eget passord</div>
          <div className="mx-auto max-w-xl text-[#47503f]">
            Du er innlogget med et midlertidig passord. Velg et nytt passord på minst 8
            tegn før du fortsetter til dashbordet.
          </div>
        </div>
        <FirstPasswordForm />
      </div>
    </div>
  );
}
