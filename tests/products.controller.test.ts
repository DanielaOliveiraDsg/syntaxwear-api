import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import { Decimal } from "@prisma/client/runtime/client";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../src/controllers/products.controller";
import * as productsService from "../src/services/products.service";
import { CreateProductType, UpdateProductType } from "../src/types";

// Mock the service
vi.mock("../src/services/products.service", () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
  saveProduct: vi.fn(),
  saveUpdatedProduct: vi.fn(),
  saveDeletedProduct: vi.fn(),
}));

// Mock slugify
vi.mock("slugify", () => ({
  default: (text: string) => text.toLowerCase().replace(/\s+/g, "-"),
}));

describe("Products Controller", () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {};
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("listProducts", () => {
    it("should list products with default filters", async () => {
      mockRequest.query = {};

      const mockResult = {
        products: [
          {
            id: "1",
            name: "Product 1",
            slug: "product-1",
            description: "Description 1",
            price: new Decimal("100.00"),
            currency: "USD",
            stock: 10,
            active: true,
            categoryId: "cat-1",
            colors: [],
            sizes: [],
            images: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            category: {
              id: "cat-1",
              name: "Category 1",
              slug: "category-1",
              description: null,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          } as any,
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      vi.mocked(productsService.getProducts).mockResolvedValue(mockResult);

      await listProducts(mockRequest as any, mockReply as any);

      expect(productsService.getProducts).toHaveBeenCalledWith({});
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });

    it("should pass filters to service", async () => {
      mockRequest.query = {
        page: 2,
        limit: 20,
        minPrice: 50,
        maxPrice: 200,
        search: "shirt",
        categoryId: "cat-1",
        sortBy: "price",
        sortOrder: "asc",
      };

      vi.mocked(productsService.getProducts).mockResolvedValue({
        products: [],
        meta: { total: 0, page: 2, limit: 20, totalPages: 0 },
      });

      await listProducts(mockRequest as any, mockReply as any);

      expect(productsService.getProducts).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        minPrice: 50,
        maxPrice: 200,
        search: "shirt",
        categoryId: "cat-1",
        sortBy: "price",
        sortOrder: "asc",
      });
    });

    it("should handle service errors", async () => {
      mockRequest.query = {};

      const error = new Error("Database error");
      vi.mocked(productsService.getProducts).mockRejectedValue(error);

      await expect(
        listProducts(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getProduct", () => {
    it("should retrieve a product by ID", async () => {
      mockRequest.params = { id: "1" };

      const mockProduct = {
        id: "1",
        name: "Product 1",
        slug: "product-1",
        description: "Description 1",
        price: new Decimal("100.00"),
        currency: "USD",
        stock: 10,
        active: true,
        categoryId: "cat-1",
        colors: ["red"],
        sizes: ["M"],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: "cat-1",
          name: "Category 1",
          slug: "category-1",
          description: null,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any;

      vi.mocked(productsService.getProductById).mockResolvedValue(mockProduct);

      await getProduct(mockRequest as any, mockReply as any);

      expect(productsService.getProductById).toHaveBeenCalledWith("1");
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockProduct);
    });

    it("should throw error if product not found", async () => {
      mockRequest.params = { id: "nonexistent" };

      vi.mocked(productsService.getProductById).mockRejectedValue(
        new Error("Product not found"),
      );

      await expect(
        getProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Product not found");
    });
  });

  describe("createProduct", () => {
    it("should create a new product", async () => {
      const bodyData = {
        name: "New Product",
        description: "Product description",
        price: 99.99,
        stock: 50,
        active: true,
        categoryId: "cat-1",
        colors: ["red", "blue"],
        sizes: ["S", "M", "L"],
      };
      mockRequest.body = bodyData;

      vi.mocked(productsService.saveProduct).mockResolvedValue({
        id: "1",
        slug: "new-product",
        name: bodyData.name,
        description: bodyData.description || null,
        price: new Decimal(bodyData.price),
        currency: "USD",
        stock: bodyData.stock,
        active: true,
        categoryId: bodyData.categoryId,
        colors: bodyData.colors || [],
        sizes: bodyData.sizes || [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await createProduct(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: "Product created successfully",
      });
      expect(productsService.saveProduct).toHaveBeenCalled();
    });

    it("should generate slug from product name", async () => {
      const bodyData = {
        name: "Cool T-Shirt",
        description: "Description",
        price: 100,
        stock: 10,
        active: true,
        categoryId: "cat-1",
      };
      mockRequest.body = bodyData;

      vi.mocked(productsService.saveProduct).mockResolvedValue({
        id: "1",
        slug: "cool-t-shirt",
        name: bodyData.name,
        description: bodyData.description || null,
        price: new Decimal(bodyData.price),
        currency: "USD",
        stock: bodyData.stock,
        active: true,
        categoryId: bodyData.categoryId,
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await createProduct(mockRequest as any, mockReply as any);

      const callArgs = vi.mocked(productsService.saveProduct).mock.calls[0][0];
      expect(callArgs.slug).toBe("cool-t-shirt");
    });

    it("should handle duplicate slug error", async () => {
      mockRequest.body = {
        name: "Existing Product",
        description: "Description",
        price: 100,
        stock: 10,
        active: true,
        categoryId: "cat-1",
      };

      vi.mocked(productsService.saveProduct).mockRejectedValue(
        new Error("Product with this slug already exists"),
      );

      await expect(
        createProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Product with this slug already exists");
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        // Missing required fields
        name: "Product",
      };

      // This will fail at validation layer (Zod)
      await expect(
        createProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow();
    });
  });

  describe("updateProduct", () => {
    it("should update a product", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "Updated Product",
        price: 150,
      };

      const updatedProduct = {
        id: "1",
        name: "Updated Product",
        slug: "updated-product",
        description: "Description",
        price: new Decimal("150.00"),
        currency: "USD",
        stock: 10,
        active: true,
        categoryId: "cat-1",
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(productsService.saveUpdatedProduct).mockResolvedValue(
        updatedProduct,
      );

      await updateProduct(mockRequest as any, mockReply as any);

      expect(productsService.saveUpdatedProduct).toHaveBeenCalledWith("1", {
        name: "Updated Product",
        price: 150,
        slug: "updated-product",
      });
      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith(updatedProduct);
    });

    it("should regenerate slug when name is updated", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "New Product Name",
      };

      const updatedProduct = {
        id: "1",
        name: "New Product Name",
        slug: "new-product-name",
        description: "Description",
        price: new Decimal("100.00"),
        currency: "USD",
        stock: 10,
        active: true,
        categoryId: "cat-1",
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(productsService.saveUpdatedProduct).mockResolvedValue(
        updatedProduct,
      );

      await updateProduct(mockRequest as any, mockReply as any);

      const callArgs = vi.mocked(productsService.saveUpdatedProduct).mock
        .calls[0][1];
      expect(callArgs.slug).toBe("new-product-name");
    });

    it("should handle product not found error", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.body = { name: "Updated Product" };

      vi.mocked(productsService.saveUpdatedProduct).mockRejectedValue(
        new Error("Product not found"),
      );

      await expect(
        updateProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Product not found");
    });

    it("should handle slug conflict error", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "Another Product" };

      vi.mocked(productsService.saveUpdatedProduct).mockRejectedValue(
        new Error("Another product with this slug already exists"),
      );

      await expect(
        updateProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Another product with this slug already exists");
    });

    it("should not regenerate slug if name is not updated", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        price: 150,
        stock: 20,
      };

      const updatedProduct = {
        id: "1",
        name: "Product",
        slug: "product",
        description: "Description",
        price: new Decimal("150.00"),
        currency: "USD",
        stock: 20,
        active: true,
        categoryId: "cat-1",
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(productsService.saveUpdatedProduct).mockResolvedValue(
        updatedProduct,
      );

      await updateProduct(mockRequest as any, mockReply as any);

      const callArgs = vi.mocked(productsService.saveUpdatedProduct).mock
        .calls[0][1];
      expect(callArgs.slug).toBeUndefined();
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product", async () => {
      mockRequest.params = { id: "1" };

      vi.mocked(productsService.saveDeletedProduct).mockResolvedValue(
        undefined,
      );

      await deleteProduct(mockRequest as any, mockReply as any);

      expect(productsService.saveDeletedProduct).toHaveBeenCalledWith("1");
      expect(mockReply.status).toHaveBeenCalledWith(204);
    });

    it("should throw error if product not found", async () => {
      mockRequest.params = { id: "nonexistent" };

      vi.mocked(productsService.saveDeletedProduct).mockRejectedValue(
        new Error("Product not found"),
      );

      await expect(
        deleteProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Product not found");
    });

    it("should handle invalid product ID validation", async () => {
      mockRequest.params = { id: "" };

      // This will fail at validation layer (Zod)
      await expect(
        deleteProduct(mockRequest as any, mockReply as any),
      ).rejects.toThrow();
    });
  });
});
