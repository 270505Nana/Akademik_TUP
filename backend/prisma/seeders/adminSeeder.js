import bcrypt from 'bcrypt';
import prisma from '../../src/config/prisma.js';

export async function seedAdmin() {
  console.log("- Seeding admin...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      password: hashedPassword,
      phone: "081234567890",
      role: "ADMIN",
      name: "Admin Akademik"
    }
  });

  await prisma.admin.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id
    }
  });

  console.log("- Admin seeded successful");
}
