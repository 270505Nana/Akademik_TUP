const prisma = require("./client");

const { seedAcademicStaff } = require("./seeders/academicStaffSeeder");

async function main() {
  console.log("Starting seeding...");

  await seedAcademicStaff();

  console.log("Seeding finished");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
