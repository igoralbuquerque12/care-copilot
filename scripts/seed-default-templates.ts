import { db } from "../src/server/db";
import { seedDefaultTemplate } from "../src/server/services/formTemplate.service";

const main = async () => {
  const profiles = await db.profile.findMany({ select: { id: true } });

  for (const profile of profiles) {
    const template = await seedDefaultTemplate(db, profile.id);
    await db.anamnesis.updateMany({
      where: { profileId: profile.id, templateId: null },
      data: { templateId: template.id },
    });
  }

  console.log(`Seeded default anamnesis templates for ${profiles.length} profiles.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
