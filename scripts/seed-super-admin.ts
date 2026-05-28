import { db } from "../src/server/db";

const email = process.argv[2] ?? process.env.SUPER_ADMIN_EMAIL;

if (!email) {
  console.error(
    "Informe o email: npx tsx scripts/seed-super-admin.ts admin@email.com",
  );
  process.exitCode = 1;
} else {
  const run = async () => {
    const profile = await db.profile.update({
      where: { email },
      data: { superAdmin: true },
      select: { id: true, email: true, name: true, superAdmin: true },
    });

    console.log(
      `Super admin habilitado para ${profile.email ?? profile.id} (${profile.name}).`,
    );
  };

  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
