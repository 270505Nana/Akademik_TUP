import prisma from '../src/config/prisma.js';

import { seedAdmin } from './seeders/adminSeeder.js';
import { seedResearchGroup } from './seeders/researchGroupSeeder.js';
import { seedDosen } from './seeders/dosenSeeder.js';
import { seedFacultyStudyProgram } from './seeders/facultyStudyProgramSeeder.js';
import { seedMahasiswa } from './seeders/mahasiswaSeeder.js';

async function main() {
  console.log("- Starting seeding...");

  await seedAdmin();

  await seedResearchGroup();
  await seedDosen();

  await seedFacultyStudyProgram();
  await seedMahasiswa();

  console.log("- Seeding finished");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
