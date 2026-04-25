const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedStudent() {
  console.log("- Seeding student...");

  const password = await bcrypt.hash("12345678", 10);
  const role = "STUDENT";
  const students = [
    {
      username: "mahasiswa1",
      email: "mahasiswa1@student.telkomuniversity.ac.id",
      nim: "2322208001",
      name: "Mahasiswa 1",
      className: "SE-07-01",
      studyProgramId: 2,
      dosenWaliId: 1,
    },
    {
      username: "mahasiswa2",
      email: "mahasiswa2@student.telkomuniversity.ac.id",
      nim: "2322208002",
      name: "Mahasiswa 2",
      className: "SE-07-01",
      studyProgramId: 2,
      dosenWaliId: 1,
    },
    {
      username: "mahasiswa3",
      email: "mahasiswa3@student.telkomuniversity.ac.id",
      nim: "2322208003",
      name: "Mahasiswa 3",
      className: "SE-07-01",
      studyProgramId: 2,
      dosenWaliId: 1,
    },
  ];

  for (const student of students) {
    let user = await prisma.user.findUnique({
      where: { email: student.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: student.username,
          email: student.email,
          password,
          role,
        },
      });
    }

    const existingStudent = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    if (existingStudent) {
      continue;
    }

    await prisma.student.create({
      data: {
        nim: student.nim,
        name: student.name,
        className: student.className,
        studyProgramId: student.studyProgramId,
        dosenWaliId: student.dosenWaliId,
        userId: user.id,
      },
    });
  }

  console.log("- Student seeded successful");
}

module.exports = { seedStudent };
