import { prisma } from "../utils/prisma.js";
import { OrderFilter, CreateOrderType, UpdateOrderStatusType } from "../types/index.js";
import { Prisma } from "@prisma/client";

export const getOrders = async (filter: OrderFilter) => {
  const { page = 1, limit = 10, status, userId } = filter;

  const where: Prisma.OrderWhereInput = {};

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take),
    },
  };
};

export const getOrderById = async (id: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If userId is provided, ensure the order belongs to that user
  if (userId && order.userId !== userId) {
    throw new Error("Access denied");
  }

  return order;
};

export const createOrder = async (data: CreateOrderType) => {
  const { userId, items, shippingAddress, paymentMethod } = data;

  // 1. Get all products from DB to get current prices and check existence/active status
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
    },
  });

  if (products.length !== items.length) {
    throw new Error("One or more products are invalid or inactive");
  }

  // 2. Map prices and calculate totals
  let orderTotal = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * item.quantity;
    orderTotal += totalPrice;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  // 3. Create order and items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        total: orderTotal,
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        paymentMethod,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return createdOrder;
  });

  return order;
};

export const updateOrderStatus = async (
  id: string,
  data: UpdateOrderStatusType,
  userId?: string,
  role?: string
) => {
  const { status, shippingAddress } = data;
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If user is not ADMIN, apply restrictions
  if (role !== "ADMIN") {
    // Ensure the order belongs to the user
    if (order.userId !== userId) {
      throw new Error("Access denied");
    }

    // Regular users can only CANCEL their own orders OR update shippingAddress if it's still PENDING
    if (status && status !== "CANCELLED") {
      throw new Error("Only admins can update order status to values other than CANCELLED");
    }

    // Can only cancel/update if it's still PENDING
    if (order.status !== "PENDING") {
      throw new Error("Only pending orders can be updated");
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(shippingAddress && { shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue }),
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      },
    },
  });

  return updatedOrder;
};

