const prisma = require("./client");

const { seedAcademicStaff } = require("./seeders/academicStaffSeeder");
const { seedResearchGroup } = require("./seeders/researchGroupSeeder");
const { seedLecturer } = require("./seeders/lecturerSeeder");
const {
  seedFacultyStudyProgram,
} = require("./seeders/facultyStudyProgramSeeder");

async function main() {
  console.log("- Starting seeding...");

  await seedAcademicStaff();
  await seedResearchGroup();
  await seedLecturer();
  await seedFacultyStudyProgram();

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
