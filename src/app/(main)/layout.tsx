// src/app/(main)/layout.tsx
import { Header } from "~/features/layout/components/header";
import { Sidebar } from "~/features/layout/components/sidebar";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">

            <div className="hidden md:flex">
                <Sidebar />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto bg-muted/20">
                    {children}
                </main>
            </div>
        </div>
    );
}