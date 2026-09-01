// src/app/(main)/layout.tsx
import { Header } from "~/features/layout/components/header";
import { Sidebar } from "~/features/layout/components/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex h-dvh overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />

        <main className="bg-muted/20 min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
