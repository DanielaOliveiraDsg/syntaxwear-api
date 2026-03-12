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
  size?: string;
}

export interface CreateOrderType {
  userId: string;
  items: CreateOrderItemType[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

export interface ShippingAddress {
  zipcode: string;
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
}

export interface UpdateOrderStatusType {
status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "DELIVERED";
  shippingAddress?: ShippingAddress;
}

export interface OrderFilter {
  page?: number;
  limit?: number;
  status?: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "DELIVERED";
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