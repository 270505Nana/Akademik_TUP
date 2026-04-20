const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedFacultyStudyProgram() {
  console.log("- Seeding faculty & study program...");

  const faculties = [
    {
      name: "Fakultas Informatika (FIF)",
      studyPrograms: [
        { name: "S1 Informatika" },
        { name: "S1 Rekayasa Perangkat Lunak (Software Engineering)" },
        { name: "S1 Sains Data (Data Science)" },
      ],
    },
    {
      name: "Fakultas Teknik Elektro (FTE)",
      studyPrograms: [
        { name: "S1 Teknik Telekomunikasi" },
        { name: "S1 Teknik Elektro" },
        { name: "S1 Teknik Biomedis" },
      ],
    },
    {
      name: "Fakultas Rekayasa Industri (FRI)",
      studyPrograms: [
        { name: "S1 Teknik Industri" },
        { name: "S1 Sistem Informasi" },
        { name: "S1 Teknik Logistik" },
        { name: "S1 Teknologi Pangan" },
      ],
    },
    {
      name: "Fakultas Industri Kreatif (FIK)",
      studyPrograms: [
        { name: "S1 Desain Komunikasi Visual (DKV)" },
        { name: "S1 Desain Produk" },
      ],
    },
    {
      name: "Fakultas Ekonomi dan Bisnis (FEB)",
      studyPrograms: [{ name: "S1 Bisnis Digital" }],
    },
    {
      name: "Fakultas Ilmu Terapan (FIT)",
      studyPrograms: [{ name: "D3 Teknologi Telekomunikasi" }],
    },
  ];

  for (const facultyData of faculties) {
    let faculty = await prisma.faculty.findFirst({
      where: { name: facultyData.name },
    });

    if (!faculty) {
      faculty = await prisma.faculty.create({
        data: {
          name: facultyData.name,
        },
      });
    }

    for (const studyProgramData of facultyData.studyPrograms) {
      const existingStudyProgram = await prisma.studyProgram.findFirst({
        where: {
          name: studyProgramData.name,
          facultyId: faculty.id,
        },
      });

      if (!existingStudyProgram) {
        await prisma.studyProgram.create({
          data: {
            name: studyProgramData.name,
            facultyId: faculty.id,
          },
        });
      }
    }
  }

  console.log("- Faculty & study program seeded successful");
}

module.exports = { seedFacultyStudyProgram };
