import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../src/utils/prisma";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../src/services/orders.service";
import { Decimal } from "@prisma/client/runtime/client";

// Mock Prisma
vi.mock("../src/utils/prisma", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      order: {
        create: vi.fn(),
      },
    })),
  },
}));

describe("Orders CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getOrders", () => {
    it("should list orders with pagination", async () => {
      const mockOrders = [
        { id: "1", userId: "user-1", total: new Decimal("100.00"), createdAt: new Date() },
      ];
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
      vi.mocked(prisma.order.count).mockResolvedValue(1);

      const result = await getOrders({ page: 1, limit: 10 });

      expect(result.orders).toEqual(mockOrders);
      expect(result.meta.total).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });

    it("should filter orders by userId", async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await getOrders({ userId: "user-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
        })
      );
    });
  });

  describe("getOrderById", () => {
    it("should retrieve an order by ID", async () => {
      const mockOrder = { id: "1", userId: "user-1" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      const result = await getOrderById("1");

      expect(result).toEqual(mockOrder);
    });

    it("should throw error when order not found", async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(getOrderById("nonexistent")).rejects.toThrow("Order not found");
    });

    it("should throw error when user access is denied", async () => {
      const mockOrder = { id: "1", userId: "user-1" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      await expect(getOrderById("1", "user-2")).rejects.toThrow("Access denied");
    });
  });

  describe("createOrder", () => {
    it("should create a new order", async () => {
      const mockProducts = [
        { id: "prod-1", price: new Decimal("50.00"), active: true },
      ];
      const orderData = {
        userId: "user-1",
        items: [{ productId: "prod-1", quantity: 2 }],
        shippingAddress: {
          zipcode: "12345",
          street: "Main St",
          number: "100",
          city: "Test City",
          state: "TS",
          country: "Testland",
        },
        paymentMethod: "CREDIT_CARD",
      };

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      
      const mockCreatedOrder = { id: "order-1", ...orderData, total: new Decimal("100.00") };
      
      // Setup transaction mock to return the created order
      const txMock = {
        order: {
          create: vi.fn().mockResolvedValue(mockCreatedOrder),
        },
      };
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(txMock));

      const result = await createOrder(orderData as any);

      expect(result).toEqual(mockCreatedOrder);
      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total: 100,
            userId: "user-1",
          }),
        })
      );
    });

    it("should throw error if a product is invalid", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      
      const orderData = {
        userId: "user-1",
        items: [{ productId: "invalid", quantity: 1 }],
      };

      await expect(createOrder(orderData as any)).rejects.toThrow(
        "One or more products are invalid or inactive"
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("should allow admin to update status to any value", async () => {
      const mockOrder = { id: "1", userId: "user-1", status: "PENDING" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: "SHIPPED" });

      const result = await updateOrderStatus("1", { status: "SHIPPED" }, "admin-1", "ADMIN");

      expect(result.status).toBe("SHIPPED");
      expect(prisma.order.update).toHaveBeenCalled();
    });

    it("should allow user to cancel their own pending order", async () => {
      const mockOrder = { id: "1", userId: "user-1", status: "PENDING" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: "CANCELLED" });

      const result = await updateOrderStatus("1", { status: "CANCELLED" }, "user-1", "USER");

      expect(result.status).toBe("CANCELLED");
    });

    it("should prevent user from updating status of other user's order", async () => {
      const mockOrder = { id: "1", userId: "user-1", status: "PENDING" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      await expect(
        updateOrderStatus("1", { status: "CANCELLED" }, "user-2", "USER")
      ).rejects.toThrow("Access denied");
    });

    it("should prevent user from updating non-pending order", async () => {
      const mockOrder = { id: "1", userId: "user-1", status: "PAID" } as any;
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);

      await expect(
        updateOrderStatus("1", { status: "CANCELLED" }, "user-1", "USER")
      ).rejects.toThrow("Only pending orders can be updated");
    });
  });
});
