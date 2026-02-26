import { prisma } from "../utils/prisma";
import { ProductFilter } from "../types";

export const getProducts = async (filter: ProductFilter) => {
  const {
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filter;

  // Initially, your object looks like this:
  const where: any = {
    active: true, // Only fetch active products by default
  };

  // Then your code checks: "Did the user provide a minPrice or maxPrice?" If yes, it executes this line: where.price = {}; This creates a new object for the price field in the where clause. Now, instead of just filtering by active: true, your query can also filter by price conditions.
  // Then, you add the specific Prisma filters (gte for "Greater Than or Equal", lte for "Less Than or Equal"): if (minPrice !== undefined) where.price.gte = minPrice;

  // when you call prisma.product.findMany({ where }), you are passing that entire object you just built. Prisma looks at the object and says: "Okay, I need to generate SQL that looks for products where active is true AND price is >= minPrice
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}; // If you use the equals sign (=), JS looks for that property. If it doesn't find it, it creates it on the fly.
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // In SQL (the language your Supabase database speaks), OR is used to say: "Find me items where Condition A is true OR Condition B is true."
  // By writing where.OR = [...], you are telling Prisma:"Hey, update my 'Shopping List' of conditions. I want you to look for the search term inside the name field OR inside the description field."
  // Prisma expects OR to be an array because you might want to compare 2, 3, or even 10 different columns. Each object inside that array is one "possibility."
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  // Execute Multiple Queries in Parallel
  // Promise.all runs both queries at the same time to save time.
  // Performance: Using Promise.all is much faster than awaiting the count and then awaiting the data separately.
  // User Experience: By returning meta (specifically totalPages), your React frontend can easily disable the "Next" button when the user reaches the end.

  // The Brackets [products, total]: Since Promise.all returns an array of results, you are telling JavaScript: "Take the first item in the result array and call it 'products', and take the second item and call it 'total'."
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take),
    },
  };
};