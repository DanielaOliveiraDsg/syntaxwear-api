import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import { Decimal } from "@prisma/client/runtime/client";
import {
  listOrders,
  getOrder,
  createOrderHandler,
  updateOrderHandler,
} from "../src/controllers/orders.controller";
import * as ordersService from "../src/services/orders.service";

// Mock the service
vi.mock("../src/services/orders.service", () => ({
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  createOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

describe("Orders Controller", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      user: {
        userId: "user-1",
        role: "USER",
      },
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("listOrders", () => {
    it("should list orders for regular user", async () => {
      mockRequest.query = {};
      const mockResult = {
        orders: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      vi.mocked(ordersService.getOrders).mockResolvedValue(mockResult);

      await listOrders(mockRequest as any, mockReply as any);

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1" })
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });

    it("should list all orders for admin", async () => {
      mockRequest.user = { userId: "admin-1", role: "ADMIN" };
      mockRequest.query = { userId: "user-2" };
      const mockResult = {
        orders: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      vi.mocked(ordersService.getOrders).mockResolvedValue(mockResult);

      await listOrders(mockRequest as any, mockReply as any);

      expect(ordersService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2" })
      );
    });

    it("should handle service errors", async () => {
      mockRequest.query = {};
      vi.mocked(ordersService.getOrders).mockRejectedValue(new Error("Database error"));

      await expect(listOrders(mockRequest as any, mockReply as any)).rejects.toThrow("Database error");
    });
  });

  describe("getOrder", () => {
    it("should retrieve an order by ID", async () => {
      mockRequest.params = { id: "order-1" };
      const mockOrder = { id: "order-1", userId: "user-1" } as any;

      vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

      await getOrder(mockRequest as any, mockReply as any);

      expect(ordersService.getOrderById).toHaveBeenCalledWith("order-1", "user-1");
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockOrder);
    });

    it("should allow admin to retrieve any order", async () => {
      mockRequest.user = { userId: "admin-1", role: "ADMIN" };
      mockRequest.params = { id: "order-1" };
      const mockOrder = { id: "order-1", userId: "user-2" } as any;

      vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

      await getOrder(mockRequest as any, mockReply as any);

      expect(ordersService.getOrderById).toHaveBeenCalledWith("order-1", undefined);
    });

    it("should throw error if order not found", async () => {
      mockRequest.params = { id: "nonexistent" };
      vi.mocked(ordersService.getOrderById).mockRejectedValue(new Error("Order not found"));

      await expect(getOrder(mockRequest as any, mockReply as any)).rejects.toThrow("Order not found");
    });
  });

  describe("createOrderHandler", () => {
    it("should create a new order", async () => {
      const bodyData = {
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
      mockRequest.body = bodyData;
      const mockOrder = { id: "order-1", ...bodyData } as any;

      vi.mocked(ordersService.createOrder).mockResolvedValue(mockOrder);

      await createOrderHandler(mockRequest as any, mockReply as any);

      expect(ordersService.createOrder).toHaveBeenCalledWith({
        ...bodyData,
        userId: "user-1",
      });
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(mockOrder);
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        items: [], // Should have at least one item
      };

      await expect(createOrderHandler(mockRequest as any, mockReply as any)).rejects.toThrow();
    });
  });

  describe("updateOrderHandler", () => {
    it("should update order status", async () => {
      mockRequest.params = { id: "order-1" };
      mockRequest.body = { status: "CANCELLED" };
      const mockOrder = { id: "order-1", status: "CANCELLED" } as any;

      vi.mocked(ordersService.updateOrderStatus).mockResolvedValue(mockOrder);

      await updateOrderHandler(mockRequest as any, mockReply as any);

      expect(ordersService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        { status: "CANCELLED" },
        "user-1",
        "USER"
      );
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockOrder);
    });

    it("should handle validation error when no fields provided", async () => {
      mockRequest.params = { id: "order-1" };
      mockRequest.body = {};

      await expect(updateOrderHandler(mockRequest as any, mockReply as any)).rejects.toThrow();
    });
  });
});
