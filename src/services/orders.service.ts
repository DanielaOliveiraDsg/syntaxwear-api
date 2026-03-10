import { prisma } from "../utils/prisma";
import { OrderFilter } from "../types";

export const getOrders = async (filter: OrderFilter) => {
  const { page = 1, limit = 10, status, userId } = filter;

  const where: any = {};

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
