import Image from "next/image";
import { ThemeToggle } from "~/features/auth/components/theme-toggle";
import { AuthTabs } from "~/features/auth/components/auth-tabs";
import { Activity } from "lucide-react";

import backgroundLogo from "../../public/background-logo.png";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-6 lg:p-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Activity className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">Care Copilot</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 lg:px-8">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-muted-foreground">
                Automações inteligentes para suporte clínico
              </p>
            </div>

            <AuthTabs />
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src={backgroundLogo}
          alt="Profissional médico usando tecnologia"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-12">
          <div className="space-y-4">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Transforme sua prática clínica
            </h2>
            <p className="text-lg font-medium text-balance text-white/90">
              O Care Copilot automatiza processos burocráticos e atua como seu
              suporte inteligente na consulta, permitindo que você devolva o
              foco ao que é essencial: o cuidado com seus pacientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
