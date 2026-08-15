import bcrypt from 'bcrypt';
import prisma from '../../src/config/prisma.js';

export async function seedMahasiswa() {
  console.log("- Seeding mahasiswa...");

  const firstStudyProgram = await prisma.studyProgram.findFirst();
  const studyProgramId = firstStudyProgram ? firstStudyProgram.id : null;

  const firstDosen = await prisma.dosen.findFirst();
  const dosenWaliId = firstDosen ? firstDosen.id : null;

  if (!studyProgramId || !dosenWaliId) {
    console.log("Study program or dosen wali not found. Please seed faculty, study program, and dosen first.");
    return;
  }

  const hashedPassword = await bcrypt.hash("mahasiswa123", 10);

  const user = await prisma.user.upsert({
    where: { email: "mahasiswa@gmail.com" },
    update: {},
    create: {
      email: "mahasiswa@gmail.com",
      password: hashedPassword,
      phone: "081234567893",
      role: "MAHASISWA",
      name: "Mahasiswa Contoh"
    }
  });

  await prisma.mahasiswa.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      nim: "2011104001",
      kelasAsal: "SE-07-01",
      tahunAngkatan: 2023,
      sks: 120,
      ipk: 3.5,
      tak: 80,
      studyProgramId,
      dosenWaliId
    }
  });

  console.log("- Mahasiswa seeded successful");
}
