import { prisma } from "../utils/prisma";
import {
  CategoryFilter,
  CreateCategoryType,
  UpdateCategoryType,
} from "../types";

export const getCategories = async (filter: CategoryFilter) => {
  const { search, active, page = 1, limit = 10 } = filter;

  const where: any = {};

  if (active !== undefined) {
    where.active = active;
  }

  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  //OR is a logical operator supported by Prisma’s filtering syntax. It tells Prisma to return records that match any of the conditions inside the array.

  // Pagination Logic
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const createCategory = async (data: CreateCategoryType) => {
  const existingCategory = await prisma.category.findUnique({
    where: { slug: data.slug },
  });

  if (existingCategory) {
    throw new Error("Category with this slug already exists");
  }

  const category = await prisma.category.create({
    data,
  });

  return category;
};

export const saveUpdatedCategory = async (
  id: string,
  data: UpdateCategoryType,
) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new Error("Category not found");
  }

  if (data.slug) {
    const slugConflict = await prisma.category.findFirst({
      where: {
        slug: data.slug,
      },
    });

    if (slugConflict && slugConflict.id !== id) {
      throw new Error("Another category with this slug already exists");
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data,
  });

  return updatedCategory;
};

export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category._count.products > 0) {
    throw new Error("Cannot delete category with associated products");
  }

  await prisma.category.update({
    where: { id },
    data: {
      active: false,
    },
  });

  return { success: true };
};
