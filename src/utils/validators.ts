import z, { size } from "zod";
import { ca } from "zod/locales";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(12, "Password must be at least 12 characters long"),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
});

export const productFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price", "name", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  categoryId: z.string().optional(),
});

export const categoryFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
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
  categoryId: z.string().min(1, "Category ID is required"),
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

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
})

export const deleteCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
})

export const createOrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  size: z.string().optional()
});

export const shippingAddressSchema = z.object({
  zipcode: z.string().min(1, "Zipcode is required"),
  street: z.string().min(1, "Street is required"),
  number: z.string().min(1, "Number is required"),
  complement: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
});

export const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED", "DELIVERED"]).optional(),
  shippingAddress: shippingAddressSchema.optional(),
}).refine(data => data.status || data.shippingAddress, {
  message: "At least one field (status or shippingAddress) must be provided",
});

export const orderFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED", "DELIVERED"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});