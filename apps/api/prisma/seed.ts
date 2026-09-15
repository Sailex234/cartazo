import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

// Solo para desarrollo local: no hay endpoint público que cree ADMIN (evita
// escalación de privilegios vía /register), así que el primer admin se
// bootstrapea por seed. Cambiar la password en cualquier ambiente real. 🔎
const ADMIN_EMAIL = "admin@cartazo.com";
const ADMIN_PASSWORD = "admin12345";

const categories = [
  { name: "Almacén", slug: "almacen" },
  { name: "Bebidas", slug: "bebidas" },
  { name: "Limpieza", slug: "limpieza" },
];

async function main() {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      name: "Admin",
      role: "ADMIN",
    },
  });

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });

    if (category.slug === "almacen") {
      await prisma.product.upsert({
        where: { id: "00000000-0000-0000-0000-000000000001" },
        update: {},
        create: {
          id: "00000000-0000-0000-0000-000000000001",
          name: "Arroz 1kg",
          description: "Arroz blanco de grano largo",
          price: 1200.5,
          stock: 50,
          categoryId: created.id,
        },
      });
    }

    if (category.slug === "bebidas") {
      await prisma.product.upsert({
        where: { id: "00000000-0000-0000-0000-000000000002" },
        update: {},
        create: {
          id: "00000000-0000-0000-0000-000000000002",
          name: "Agua mineral 1.5L",
          description: "Agua mineral sin gas",
          price: 800,
          stock: 100,
          categoryId: created.id,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
