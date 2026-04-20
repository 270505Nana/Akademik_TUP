const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedFacultyProdi() {
  console.log("- Seeding faculty & prodi...");

  const faculties = [
    {
      name: "Fakultas Informatika (FIF)",
      prodies: [
        { name: "S1 Informatika" },
        { name: "S1 Rekayasa Perangkat Lunak (Software Engineering)" },
        { name: "S1 Sains Data (Data Science)" },
      ],
    },
    {
      name: "Fakultas Teknik Elektro (FTE)",
      prodies: [
        { name: "S1 Teknik Telekomunikasi" },
        { name: "S1 Teknik Elektro" },
        { name: "S1 Teknik Biomedis" },
      ],
    },
    {
      name: "Fakultas Rekayasa Industri (FRI)",
      prodies: [
        { name: "S1 Teknik Industri" },
        { name: "S1 Sistem Informasi" },
        { name: "S1 Teknik Logistik" },
        { name: "S1 Teknologi Pangan" },
      ],
    },
    {
      name: "Fakultas Industri Kreatif (FIK)",
      prodies: [
        { name: "S1 Desain Komunikasi Visual (DKV)" },
        { name: "S1 Desain Produk" },
      ],
    },
    {
      name: "Fakultas Ekonomi dan Bisnis (FEB)",
      prodies: [{ name: "S1 Bisnis Digital" }],
    },
    {
      name: "Fakultas Ilmu Terapan (FIT)",
      prodies: [{ name: "D3 Teknologi Telekomunikasi" }],
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

    for (const prodiData of facultyData.prodies) {
      const existingProdi = await prisma.studyProgram.findFirst({
        where: {
          name: prodiData.name,
          facultyId: faculty.id,
        },
      });

      if (!existingProdi) {
        await prisma.studyProgram.create({
          data: {
            name: prodiData.name,
            facultyId: faculty.id,
          },
        });
      }
    }
  }

  console.log("- Faculty & prodi seeded successful");
}

module.exports = { seedFacultyProdi };
