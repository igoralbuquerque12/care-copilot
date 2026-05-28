import { redirect } from "next/navigation";

import { SuperAdminCreateDoctorPage } from "~/features/super-admin/components/super-admin-create-doctor-page";
import { getUser } from "~/server/auth/supabase.server";
import { db } from "~/server/db";

export const metadata = {
  title: "Super Admin | Care Copilot",
};

export default async function SuperAdminPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth");
  }

  const profile = await db.profile.findUnique({
    where: { id: user.id },
    select: { superAdmin: true },
  });

  if (!profile?.superAdmin) {
    redirect("/profile");
  }

  return <SuperAdminCreateDoctorPage />;
}
