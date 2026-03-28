import { prisma } from "../utils/prisma.js";
import {
  CreateProductType,
  ProductFilter,
  UpdateProductType,
} from "../types/index.js";

// GET - list of products with filters, pagination, and sorting
export const getProducts = async (filter: ProductFilter) => {
  const {
    minPrice,
    maxPrice,
    search,
    categoryId,
    gender,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filter;

  const where: any = {
    active: true, // Only fetch active products by default
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (gender) where.gender = gender;

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

  // Execute Multiple Queries in Parallel
  // Promise.all runs both queries at the same time to save time.

  // The Brackets [products, total]: Since Promise.all returns an array of results, you are telling JavaScript: "Take the first item in the result array and call it 'products', and take the second item and call it 'total'."
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      price: Number(p.price), // Convert Decimal to Number for the frontend
    })),
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take),
    },
  };
};

// GET BY ID - specific product (READ)
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    ...product,
    price: Number(product.price),
  };
};

// CREATE - add a new product (CREATE)
export const saveProduct = async (data: CreateProductType) => {
  const existingProduct = await prisma.product.findUnique({
    where: { slug: data.slug },
  });

  if (existingProduct) {
    throw new Error("Product with this slug already exists");
  }

  const newProduct = await prisma.product.create({ data });
  return newProduct;
};

// UPDATE - modify an existing product (UPDATE)
export const saveUpdatedProduct = async (
  id: string,
  data: UpdateProductType,
) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  if (data.slug) {
    const slugConflict = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (slugConflict && slugConflict.id !== id) {
      throw new Error("Another product with this slug already exists");
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });
  return updatedProduct;
};

// DELETE - delete a existing product
export const saveDeletedProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.product.update({
    where: { id },
    data: { active: false },
  });
};
