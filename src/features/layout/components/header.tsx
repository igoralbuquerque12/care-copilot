import Link from "next/link";

import { getUser } from "~/server/auth/supabase.server";
import { UserDropdown } from "~/features/layout/components/userDropdown";
import { MobileSidebar } from "~/features/layout/components/mobileSidebar";

export async function Header() {
  const user = await getUser();

  const userData = user ? {
    name: user.user_metadata.name as string | undefined,
    email: user.email,
    photoUrl: user.user_metadata.photoUrl as string | undefined
  } : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-end px-4 md:px-6">

        <div className="flex items-center gap-4">
          <MobileSidebar />

          {userData ? (
            <UserDropdown user={userData} />
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
