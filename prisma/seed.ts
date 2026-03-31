import "dotenv/config";
import { PrismaClient, Prisma, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname in ES Module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Database Connection
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Path to images
const imagesDir = path.resolve(
  __dirname,
  "../../syntaxwear-app/public/images/products",
);

async function main() {
  console.log("🌱 Start seeding...");

  // CLEANUP
  console.log("🧹 Cleaning old data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // SEED USERS
  console.log("👤 Seeding users...");
  const passwordHash = bcrypt.hashSync("password123", 10);
  const john = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      passwordHash,
      role: "USER",
    },
  });

  // SEED CATEGORIES
  console.log("📂 Seeding categories...");
  const categories = {
    casual: await prisma.category.create({
      data: {
        name: "Casual",
        slug: "casual",
        description: "Everyday sneakers",
      },
    }),
    sport: await prisma.category.create({
      data: {
        name: "Sport",
        slug: "sport",
        description: "Performance footwear",
      },
    }),
    modern: await prisma.category.create({
      data: {
        name: "Modern",
        slug: "modern",
        description: "Contemporary style",
      },
    }),
  };

  // AUTO-SCAN IMAGES
  console.log("📸 Scanning product images...");
  const files = fs.readdirSync(imagesDir).filter((f) => !f.startsWith("."));
  const groups: Record<string, string[]> = {};

  files.forEach((file) => {
    // Splits "men-casual-black-1.png" -> "men-casual-black"
    const slug = file.split("-").slice(0, -1).join("-");
    if (!groups[slug]) groups[slug] = [];
    groups[slug].push(`/images/products/${file}`);
  });

  // POPULATE PRODUCTS
  console.log("👟 Creating products from files...");
  for (const [slug, imagePaths] of Object.entries(groups)) {
    const sizes = {
      men: [
        "5.5",
        "6",
        "6.5",
        "7",
        "7.5",
        "8",
        "8.5",
        "9",
        "9.5",
        "10",
        "10.5",
        "11",
        "12",
        "12.5",
      ],
      women: [
        "5.5",
        "6",
        "6.5",
        "7",
        "7.5",
        "8",
        "8.5",
        "9",
        "9.5",
        "10",
        "10.5",
        "11",
        "12",
      ],
      unisex: [
        "5/6.5",
        "5.5/7",
        "6/7.5",
        "6.5/8",
        "7/8.5",
        "7.5/9",
        "8/9.5",
        "8.5/10",
        "9/10.5",
        "9.5/11",
        "10/11.5",
        "10.5/12",
        "11/12.5",
        "11.5/13",
        "12/13.5",
      ],
    };

    // Determine Gender and sizes
    let productGender: Gender = Gender.UNISEX;
    let productSizes = sizes.unisex as string[];

    // 1. Check for WOMEN first (because "women" contains "men")
    if (slug.toLowerCase().includes("women")) {
      productGender = Gender.WOMEN;
      productSizes = sizes.women as string[];
    }
    // 2. Then check for MEN (ensuring it's not a woman's shoe)
    else if (slug.toLowerCase().includes("men")) {
      productGender = Gender.MEN;
      productSizes = sizes.men as string[];
    }
    // 3. Fallback to UNISEX
    else {
      productGender = Gender.UNISEX;
      productSizes = sizes.unisex as string[];
    }
    // Determine Category
    let categoryId = categories.casual.id; // Default to Casual
    if (slug.toLowerCase().includes("sport")) categoryId = categories.sport.id;
    if (slug.toLowerCase().includes("modern"))
      categoryId = categories.modern.id;

    let price = 129.99;
    if (slug.toLowerCase().includes("sport")) price = 159.99;
    if (slug.toLowerCase().includes("casual")) price = 89.99;
    if (slug.toLowerCase().includes("modern")) price = 199.99;

    const validColors = [
      "black",
      "white",
      "off-white",
      "blue",
      "red",
      "green",
      "teal",
      "grey",
      "navy",
      "beige",
      "brown",
      "leopard",
      "yellow",
      "lilac",
      "pink",
      "multicolor",
    ];

    const detectedColor = validColors.find((color) =>
      slug.toLowerCase().includes(color),
    );

    const productColor = detectedColor
      ? detectedColor.charAt(0).toUpperCase() + detectedColor.slice(1)
      : "Original";

    await prisma.product.create({
      data: {
        name: slug.replace(/-/g, " ").toUpperCase(),
        slug: slug,
        price: new Prisma.Decimal(price),
        description: `Premium ${slug.replace(/-/g, " ")} designed for SyntaxWear.`,
        gender: productGender,
        categoryId: categoryId,
        images: imagePaths.sort(),
        colors: [productColor],
        sizes: productSizes,
        stock: 25,
      },
    });
  }

  console.log("✅ Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
