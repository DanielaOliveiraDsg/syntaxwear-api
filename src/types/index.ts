export interface ProductFilter {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "price" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
  categoryId?: string;
}

export interface CategoryFilter {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  birthDate?: string;
  phone?: string;
  role?: 'USER' | 'ADMIN';
}

export interface CreateProductType {
  name: string;
  slug: string;
  description: string;
  price: number;
  colors?: string[];
  sizes?: string[];
  stock: number;
  images?: string[];
  active: boolean;
  categoryId: string;
}

export interface UpdateProductType extends Partial<CreateProductType> {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface CreateCategoryType {
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
}

export interface UpdateCategoryType extends Partial<CreateCategoryType> {
  name?: string;
  slug?: string;
}

export interface CreateOrderItemType {
  productId: string;
  quantity: number;
}

export interface CreateOrderType {
  items: CreateOrderItemType[];
}

export interface UpdateOrderStatusType {
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
}

export interface OrderFilter {
  page?: number;
  limit?: number;
  status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  userId?: string;
  startDate?: string;
  endDate?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: {
      userId: string;
      role: string;
    };
  }
}