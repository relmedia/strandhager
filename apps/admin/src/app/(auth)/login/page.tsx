import { Suspense } from "react";

import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";
import { APP_CONFIG } from "@/config/app-config";

export default function LoginPage() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-[#e4f6cf] lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Image
              src="/images/logo.png"
              alt={APP_CONFIG.name}
              width={200}
              height={137}
              priority
              className="mx-auto h-auto w-50"
            />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-[#20261c]">Velkommen tilbake</h1>
              <p className="text-[#47503f] text-xl">Logg inn for å fortsette</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-[#f7faf3] p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium text-[#20261c] tracking-tight">Logg inn</div>
            <div className="mx-auto max-w-xl text-[#47503f]">
              Logg inn med Google eller e-post for å få tilgang til administrasjonspanelet.
            </div>
          </div>
          <div className="space-y-4">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
