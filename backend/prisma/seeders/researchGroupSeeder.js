const bcrypt = require("bcrypt");

const prisma = require("../client");

async function seedResearchGroup() {
  console.log("- Seeding research group...");

  const researchGroups = [
    { name: "Applied Artificial Intellige" },
    { name: "Bioengineering, Food Technology and Advance Material" },
    { name: "Cyber Security, IOT, and Cloud System" },
    { name: "Data Science and Optimization" },
    { name: "Electronics and Telecommunications Science" },
    { name: "Industrial Systems Engineering" },
    { name: "Information System, Digital Business & Data Driven Solution" },
    { name: "Media, Design and Creative Innovation" },
    { name: "Software Engineering and Multimedia" },
  ];

  for (const item of researchGroups) {
    const existingResearchGroup = await prisma.researchGroup.findFirst({
      where: { name: item.name },
    });

    if (!existingResearchGroup) {
      await prisma.researchGroup.create({
        data: {
          name: item.name,
        },
      });
    }
  }

  console.log("- Research group seeded successful");
}

module.exports = { seedResearchGroup };
