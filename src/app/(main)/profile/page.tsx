import type { Metadata } from "next";
import { ProfileForm } from "~/features/profile/components/profileForm";

export const metadata: Metadata = {
  title: "Minha Conta | Care Copilot",
  description: "Gerencie suas informações pessoais e preferências",
};

export default function ProfilePage() {
  return (
    <main className="bg-muted/40 w-full p-4 md:p-6 lg:p-8">
      <div className="w-full">
        <ProfileForm />
      </div>
    </main>
  );
}
