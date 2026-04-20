const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedAcademicStaff() {
  console.log("- Seeding academic staff...");

  const password = await bcrypt.hash("12345678", 10);
  const role = "ACADEMIC_STAFF";

  await prisma.user.createMany({
    data: [
      {
        username: "admin1",
        email: "admin1@telkomuniversity.ac.id",
        password,
        role,
      },
      {
        username: "admin2",
        email: "admin2@telkomuniversity.ac.id",
        password,
        role,
      },
    ],
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    where: {
      role: "ACADEMIC_STAFF",
    },
  });

  await prisma.academicStaff.createMany({
    data: users.map((user, index) => ({
      name: `Admin ${index + 1}`,
      userId: user.id,
    })),
    skipDuplicates: true,
  });

  console.log("- Academic staff seeded successful");
}

module.exports = { seedAcademicStaff };
