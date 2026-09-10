import Link from "next/link";

import { getUser } from "~/server/auth/supabase.server";
import { UserDropdown } from "~/features/layout/components/user-dropdown";
import { MobileSidebar } from "~/features/layout/components/mobile-sidebar";

export async function Header() {
  const user = await getUser();

  const userData = user
    ? {
        name: user.user_metadata.name as string | undefined,
        email: user.email,
        photoUrl: user.user_metadata.photoUrl as string | undefined,
      }
    : null;

  return (
    <header className="border-border bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-sm">
      <div className="flex h-16 items-center justify-end px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileSidebar />

          {userData ? (
            <UserDropdown user={userData} />
          ) : (
            <Link
              href="/auth"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
