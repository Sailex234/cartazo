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
  { name: "Lácteos", slug: "lacteos" },
  { name: "Snacks", slug: "snacks" },
  { name: "Limpieza", slug: "limpieza" },
];

// IDs fijos: el seed es idempotente (upsert), se puede correr varias veces.
// Sin imageUrl a propósito; se cargan desde el admin. Algunos tienen stock bajo
// o cero para que el catálogo y el panel muestren esos estados.
const products = [
  { id: "00000000-0000-0000-0000-000000000001", category: "almacen", name: "Arroz largo fino 1kg", description: "Arroz blanco de grano largo, no se pasa. Ideal para guarniciones y risottos.", price: 1200.5, stock: 50 },
  { id: "00000000-0000-0000-0000-000000000002", category: "bebidas", name: "Agua mineral 1.5L", description: "Agua mineral sin gas, botella retornable.", price: 800, compareAtPrice: 1000, stock: 100 },
  { id: "00000000-0000-0000-0000-000000000003", category: "almacen", name: "Aceite de oliva extra virgen 500ml", description: "Primera prensada en frío, acidez menor a 0,5%.", price: 8900, stock: 25 },
  { id: "00000000-0000-0000-0000-000000000004", category: "almacen", name: "Yerba mate 1kg", description: "Yerba mate con palo, estacionada 12 meses. Sabor suave y parejo.", price: 4800, compareAtPrice: 6000, stock: 60 },
  { id: "00000000-0000-0000-0000-000000000005", category: "almacen", name: "Café molido 250g", description: "Mezcla de granos arábica tostado medio, molienda para filtro.", price: 5600, stock: 3 },
  { id: "00000000-0000-0000-0000-000000000006", category: "almacen", name: "Harina 000 1kg", description: "Harina de trigo 000, ideal para panificados y pastas caseras.", price: 1050, compareAtPrice: 1300, stock: 70 },
  { id: "00000000-0000-0000-0000-000000000007", category: "bebidas", name: "Jugo de naranja 1L", description: "Jugo exprimido, sin conservantes ni azúcar agregada.", price: 2100, stock: 40 },
  { id: "00000000-0000-0000-0000-000000000008", category: "bebidas", name: "Gaseosa cola 2.25L", description: "Gaseosa sabor cola, botella familiar.", price: 2400, compareAtPrice: 2990, stock: 70 },
  { id: "00000000-0000-0000-0000-000000000009", category: "lacteos", name: "Leche entera 1L", description: "Leche entera larga vida, en sachet.", price: 1100, compareAtPrice: 1400, stock: 90 },
  { id: "00000000-0000-0000-0000-000000000010", category: "lacteos", name: "Queso cremoso 500g", description: "Queso cremoso, ideal para pizzas y tostados.", price: 5200, stock: 15 },
  { id: "00000000-0000-0000-0000-000000000011", category: "lacteos", name: "Yogur natural 1kg", description: "Yogur natural sin azúcar, entero y cremoso.", price: 2300, stock: 0 },
  { id: "00000000-0000-0000-0000-000000000012", category: "snacks", name: "Alfajores de chocolate x6", description: "Alfajores triples con dulce de leche y baño de chocolate.", price: 3400, compareAtPrice: 4200, stock: 45 },
  { id: "00000000-0000-0000-0000-000000000013", category: "snacks", name: "Papas fritas clásicas 150g", description: "Papas fritas crocantes, receta clásica con sal.", price: 1900, stock: 4 },
  { id: "00000000-0000-0000-0000-000000000014", category: "snacks", name: "Mix de frutos secos 200g", description: "Almendras, nueces, castañas y pasas de uva.", price: 3900, stock: 30 },
  { id: "00000000-0000-0000-0000-000000000015", category: "limpieza", name: "Detergente 750ml", description: "Detergente concentrado, limón. Rinde el doble.", price: 1500, compareAtPrice: 1800, stock: 55 },
  { id: "00000000-0000-0000-0000-000000000016", category: "limpieza", name: "Lavandina 1L", description: "Lavandina con detergente, desinfecta y blanquea.", price: 900, stock: 2 },
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

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryIds.set(category.slug, created.id);
  }

  for (const { category, ...product } of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      // Las ofertas del seed se re-aplican; el resto no se pisa si se editó desde el admin.
      update: product.compareAtPrice ? { compareAtPrice: product.compareAtPrice } : {},
      create: { ...product, categoryId: categoryIds.get(category)! },
    });
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
