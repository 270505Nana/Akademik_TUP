const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedLecturer() {
  console.log("- Seeding lecturer...");

  const password = await bcrypt.hash("12345678", 10);
  const role = "LECTURER";
  const lecturers = [
    {
      username: "dosen1",
      email: "dosen1@telkomuniversity.ac.id",
      nip: "198706152019031001",
      nidn: "1100223344",
      lecturerCode: "BDS",
      name: "Dr. Budi Santoso",
      researchGroupId: 1,
    },
    {
      username: "dosen2",
      email: "dosen2@telkomuniversity.ac.id",
      nip: "197912042018022002",
      nidn: "2200334455",
      lecturerCode: "STR",
      name: "Dr. Siti Rahmawati",
      researchGroupId: 2,
    },
    {
      username: "dosen3",
      email: "dosen3@telkomuniversity.ac.id",
      nip: "199001232020011003",
      nidn: "3300445566",
      lecturerCode: "ADP",
      name: "Dr. Andi Pratama",
      researchGroupId: 1,
    },
  ];

  for (const lecturer of lecturers) {
    let user = await prisma.user.findUnique({
      where: { email: lecturer.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: lecturer.username,
          email: lecturer.email,
          password,
          role,
        },
      });
    }

    const existingLecturer = await prisma.lecturer.findFirst({
      where: { userId: user.id },
    });

    if (existingLecturer) {
      continue;
    }

    await prisma.lecturer.create({
      data: {
        nip: lecturer.nip,
        nidn: lecturer.nidn,
        lecturerCode: lecturer.lecturerCode,
        name: lecturer.name,
        researchGroupId: lecturer.researchGroupId,
        userId: user.id,
      },
    });
  }

  console.log("- Lecturer seeded successful");
}

module.exports = { seedLecturer };
