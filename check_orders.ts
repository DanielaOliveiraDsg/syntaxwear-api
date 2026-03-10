import { prisma } from "./src/utils/prisma";

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
