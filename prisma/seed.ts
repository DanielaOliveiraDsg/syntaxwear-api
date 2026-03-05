import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Setup the connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Initialize the client with the adapter
const prisma = new PrismaClient({ adapter });


const categories = [
  {
    name: "Hoodies & Sweatshirts",
    slug: "hoodies-sweatshirts",
    description: "Cozy hoodies and sweatshirts perfect for coding marathons.",
    active: true,
  },
  {
    name: "T-Shirts & Tops",
    slug: "tshirts-tops",
    description: "Classic and designer t-shirts with dev-inspired graphics.",
    active: true,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Beanies, socks, and other small accessories.",
    active: true,
  },
  {
    name: "Outerwear",
    slug: "outerwear",
    description: "Jackets, bombers, and layering pieces.",
    active: true,
  },
  {
    name: "Bottoms",
    slug: "bottoms",
    description: "Joggers, pants, and shorts.",
    active: true,
  },
  {
    name: "Hats & Caps",
    slug: "hats-caps",
    description: "Baseball caps, beanies, and hats for every season.",
    active: true,
  },
  {
    name: "Bags & Backpacks",
    slug: "bags-backpacks",
    description: "Laptop bags and backpacks for developers on the go.",
    active: true,
  },
  {
    name: "Footwear",
    slug: "footwear",
    description: "Comfortable sneakers designed for tech enthusiasts.",
    active: true,
  },
  {
    name: "Limited Edition",
    slug: "limited-edition",
    description: "Exclusive and limited run collections.",
    active: true,
  },
  {
    name: "Bundles & Sets",
    slug: "bundles-sets",
    description: "Save more with our curated gift sets and bundles.",
    active: true,
  },
];

const products = [
  {
    name: "Syntax Classic Hoodie",
    slug: "syntax-classic-hoodie",
    description:
      "A premium heavyweight hoodie featuring the SyntaxWear logo. Perfect for late-night coding sessions.",
    price: new Prisma.Decimal(59.99),
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Dark Gray"],
    stock: 50,
    active: true,
    categoryId: "hoodies-sweatshirts", // Will be replaced with actual ID
  },
  {
    name: "Debug Mode T-Shirt",
    slug: "debug-mode-tee",
    description:
      'Cotton t-shirt for when you are in the zone. Minimalist design with "DEBUG" in monospace.',
    price: new Prisma.Decimal(24.99),
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Black"],
    stock: 100,
    active: true,
    categoryId: "tshirts-tops",
  },
  {
    name: "Binary Code Beanie",
    slug: "binary-code-beanie",
    description:
      "Warm knit beanie with subtle binary pattern. 01010111 01100101 01100001 01110010.",
    price: new Prisma.Decimal(19.99),
    images: [
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=800",
    ],
    sizes: ["One Size"],
    colors: ["Charcoal", "Black"],
    stock: 75,
    active: true,
    categoryId: "hats-caps",
  },
  {
    name: "Git Commit Cap",
    slug: "git-commit-cap",
    description:
      "Adjustable baseball cap with \"git commit -m 'fire'\" embroidery.",
    price: new Prisma.Decimal(22.5),
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e1c7?q=80&w=800",
    ],
    sizes: ["Adjustable"],
    colors: ["Forest Green", "Black", "Beige"],
    stock: 40,
    active: true,
    categoryId: "hats-caps",
  },
  {
    name: "Recursion Oversized Sweater",
    slug: "recursion-sweater",
    description:
      "To understand recursion, you must first understand recursion. Comfy oversized fit.",
    price: new Prisma.Decimal(65.0),
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800",
    ],
    sizes: ["S/M", "L/XL"],
    colors: ["Cream", "Sand"],
    stock: 30,
    active: true,
    categoryId: "hoodies-sweatshirts",
  },
  {
    name: "Stack Overflow Socks",
    slug: "stack-overflow-socks",
    description:
      "Bamboo fiber socks that never overflow. Great gift for developers.",
    price: new Prisma.Decimal(12.0),
    images: [
      "https://images.unsplash.com/photo-1582966232435-b5415f624479?q=80&w=800",
    ],
    sizes: ["M", "L"],
    colors: ["Orange", "White"],
    stock: 150,
    active: true,
    categoryId: "accessories",
  },
  {
    name: "Null Pointer Joggers",
    slug: "null-pointer-joggers",
    description:
      "Relaxed fit joggers for developers who prefer living in the console.",
    price: new Prisma.Decimal(45.99),
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Heather Gray"],
    stock: 60,
    active: true,
    categoryId: "bottoms",
  },
  {
    name: "404 Not Found T-Shirt",
    slug: "404-not-found-tee",
    description:
      "Classic tee for when you just want to disappear from the grid.",
    price: new Prisma.Decimal(24.99),
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Blue"],
    stock: 90,
    active: true,
    categoryId: "tshirts-tops",
  },
  {
    name: "Semantic HTML Hoodie",
    slug: "semantic-html-hoodie",
    description:
      "Wear your structure on your sleeve. A clean, minimal design for web purists.",
    price: new Prisma.Decimal(59.99),
    images: [
      "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?q=80&w=800",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Slate", "Black"],
    stock: 45,
    active: true,
    categoryId: "hoodies-sweatshirts",
  },
  {
    name: "Coffee to Code Bomber Jacket",
    slug: "coffee-code-bomber",
    description:
      "Sleek bomber jacket that transitions from the coffee shop to the workstation.",
    price: new Prisma.Decimal(89.0),
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800",
    ],
    sizes: ["M", "L", "XL"],
    colors: ["Olive", "Midnight Black"],
    stock: 25,
    active: true,
    categoryId: "outerwear",
  },
];

async function main() {
  console.log("🌱 Start seeding...");

  // Seed categories first
  console.log("\n📂 Seeding categories...");
  const categoryMap: { [key: string]: string } = {};

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
    categoryMap[categoryData.slug] = category.id;
    console.log(
      `  - Created/Updated category: ${category.name} (${category.id})`,
    );
  }

  // Seed products
  console.log("\n👕 Seeding products...");
  for (const productData of products) {
    // Replace category slug with actual category ID
    const categorySlug = productData.categoryId as string;
    const categoryId = categoryMap[categorySlug];

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: { categoryId },
      create: { ...productData, categoryId },
    });
    console.log(`  - Created/Updated product: ${product.name} (${product.id})`);
  }

  console.log("\n✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
