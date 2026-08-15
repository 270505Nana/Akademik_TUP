import bcrypt from 'bcrypt';
import prisma from '../../src/config/prisma.js';

export async function seedDosen() {
  console.log("- Seeding dosen...");

  const firstResearchGroup = await prisma.researchGroup.findFirst();
  const researchGroupId = firstResearchGroup ? firstResearchGroup.id : null;

  if (!researchGroupId) {
    console.log("No research group found. Please seed research group first.");
    return;
  }

  const hashedPassword = await bcrypt.hash("dosen123", 10);

  const users = [
    {
      email: "dosen1@gmail.com",
      phone: "081234567891",
      name: "Dosen Pembimbing Satu",
      role: "DOSEN"
    },
    {
      email: "dosen2@gmail.com",
      phone: "081234567892",
      name: "Dosen Pembimbing Dua",
      role: "DOSEN"
    }
  ];

  const dosenData = [
    {
      nip: "198501012010011002",
      nidn: "0401018501",
      kodeDosen: "DPS",
      lecturerCode: "DPS"
    },
    {
      nip: "199001012015012003",
      nidn: "0401019002",
      kodeDosen: "DPD",
      lecturerCode: "DPD"
    }
  ];

  for (let i = 0; i < users.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: users[i].email },
      update: {},
      create: {
        email: users[i].email,
        password: hashedPassword,
        phone: users[i].phone,
        role: users[i].role,
        name: users[i].name
      }
    });

    await prisma.dosen.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        nip: dosenData[i].nip,
        nidn: dosenData[i].nidn,
        kodeDosen: dosenData[i].kodeDosen,
        researchGroupId
      }
    });
  }

  console.log("- Dosen seeded successful");
}
