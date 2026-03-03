import z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const productFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.coerce.number().nonnegative("Price must be a non-negative number"),
  colors: z.array(z.string()).optional(),
  stock: z.coerce.number().int().nonnegative("Stock must be a non-negative integer"),
  sizes: z.array(z.string()).optional(),
  slug: z.string().min(1, "Slug id is required"),
  active: z.boolean(),
  images: z.array(z.string()).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().min(1, "Product description is required").optional(),
  price: z.coerce.number().nonnegative("Price must be a non-negative number").optional(),
  colors: z.array(z.string()).optional(),
  stock: z.coerce.number().int().nonnegative("Stock must be a non-negative integer").optional(),
  sizes: z.array(z.string()).optional(),
  slug: z.string().min(1, "Slug id is required").optional(),
  active: z.boolean().optional(),
  images: z.array(z.string()).optional(),
})

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
})