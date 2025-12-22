import type { Metadata } from "next";
import { ProfileForm } from "~/features/profile/components/profileForm";

export const metadata: Metadata = {
  title: "Minha Conta | Care Copilot",
  description: "Gerencie suas informações pessoais e preferências",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-muted/40 py-8">
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <ProfileForm />
      </div>
    </div>
  );
}