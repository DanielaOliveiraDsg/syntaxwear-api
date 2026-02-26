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

  const where: any = {
    active: true, // Only fetch active products by default
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

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