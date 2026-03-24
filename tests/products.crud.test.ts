import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../src/utils/prisma";
import {
  getProducts,
  getProductById,
  saveProduct,
  saveUpdatedProduct,
  saveDeletedProduct,
} from "../src/services/products.service";
import {
  CreateProductType,
  UpdateProductType,
  ProductFilter,
} from "../src/types";
import { Decimal } from "@prisma/client/runtime/client";

// Mock Prisma
vi.mock("../src/utils/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Products CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getProducts", () => {
    it("should list all active products with default pagination", async () => {
      const mockProducts = [
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
          colors: ["red"],
          sizes: ["M"],
          images: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { id: "cat-1", name: "Category 1", slug: "category-1" },
        } as any,
        {
          id: "2",
          name: "Product 2",
          slug: "product-2",
          description: "Description 2",
          price: new Decimal("200.00"),
          currency: "USD",
          stock: 20,
          active: true,
          categoryId: "cat-1",
          colors: ["blue"],
          sizes: ["L"],
          images: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { id: "cat-1", name: "Category 1", slug: "category-1" },
        } as any,
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(2);

      const result = await getProducts({ page: 1, limit: 10 });

      expect(result.products).toEqual(mockProducts);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(prisma.product.count).toHaveBeenCalled();
    });

    it("should filter products by price range", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Product 1",
          slug: "product-1",
          description: "Description 1",
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
          category: { id: "cat-1", name: "Category 1", slug: "category-1" },
        } as any,
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const filter: ProductFilter = {
        minPrice: 100,
        maxPrice: 200,
        page: 1,
        limit: 10,
      };
      const result = await getProducts(filter);

      expect(result.products).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            price: { gte: 100, lte: 200 },
          }),
        }),
      );
    });

    it("should search products by name and description", async () => {
      const mockProducts = [
        {
          id: "1",
          name: "Cool T-Shirt",
          slug: "cool-t-shirt",
          description: "A cool shirt for summer",
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
          category: { id: "cat-1", name: "Category 1", slug: "category-1" },
        } as any,
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const filter: ProductFilter = { search: "cool", page: 1, limit: 10 };
      const result = await getProducts(filter);

      expect(result.products).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            OR: [
              { name: { contains: "cool", mode: "insensitive" } },
              { description: { contains: "cool", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should filter products by category", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const filter: ProductFilter = { categoryId: "cat-1", page: 1, limit: 10 };
      await getProducts(filter);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            categoryId: "cat-1",
          }),
        }),
      );
    });

    it("should handle pagination correctly", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(50);

      const filter: ProductFilter = { page: 3, limit: 10 };
      const result = await getProducts(filter);

      expect(result.meta.totalPages).toBe(5);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3 - 1) * 10
          take: 10,
        }),
      );
    });

    it("should sort products by specified field and order", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const filter: ProductFilter = {
        sortBy: "price",
        sortOrder: "asc",
        page: 1,
        limit: 10,
      };
      await getProducts(filter);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: "asc" },
        }),
      );
    });

    it("should combine multiple filters", async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const filter: ProductFilter = {
        minPrice: 50,
        maxPrice: 300,
        search: "shirt",
        categoryId: "cat-1",
        page: 2,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      const result = await getProducts(filter);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            categoryId: "cat-1",
            price: { gte: 50, lte: 300 },
            OR: [
              { name: { contains: "shirt", mode: "insensitive" } },
              { description: { contains: "shirt", mode: "insensitive" } },
            ],
          }),
          orderBy: { createdAt: "desc" },
          skip: 20,
          take: 20,
        }),
      );
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(20);
    });
  });

  describe("getProductById", () => {
    it("should retrieve a product by ID", async () => {
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
        category: { id: "cat-1", name: "Category 1", slug: "category-1" },
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      const result = await getProductById("1");

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: { category: true },
      });
    });

    it("should throw error when product not found", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(getProductById("nonexistent")).rejects.toThrow(
        "Product not found",
      );
    });

    it("should include category in response", async () => {
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
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: "cat-1", name: "Category 1", slug: "category-1" },
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);

      const result = await getProductById("1");

      expect(result.category).toBeDefined();
      expect(result.category?.id).toBe("cat-1");
    });
  });

  describe("saveProduct", () => {
    const validProduct: CreateProductType = {
      name: "New Product",
      slug: "new-product",
      description: "Product description",
      price: 99.99,
      stock: 50,
      active: true,
      categoryId: "cat-1",
      colors: ["red", "blue"],
      sizes: ["S", "M", "L"],
      images: ["image1.jpg"],
    };

    it("should create a new product", async () => {
      const createdProduct = {
        id: "1",
        ...validProduct,
        currency: "USD",
        price: new Decimal("99.99"),
        colors: ["red", "blue"],
        sizes: ["S", "M", "L"],
        images: ["image1.jpg"],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.product.create).mockResolvedValue(createdProduct);

      const result = await saveProduct(validProduct);

      expect(result).toEqual(createdProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: "new-product" },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: validProduct,
      });
    });

    it("should throw error if slug already exists", async () => {
      const existingProduct = {
        id: "1",
        name: validProduct.name,
        slug: validProduct.slug,
        description: validProduct.description,
        price: new Decimal("99.99"),
        currency: "USD",
        stock: validProduct.stock,
        active: validProduct.active,
        categoryId: validProduct.categoryId,
        colors: validProduct.colors,
        sizes: validProduct.sizes,
        images: validProduct.images,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);

      await expect(saveProduct(validProduct)).rejects.toThrow(
        "Product with this slug already exists",
      );
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it("should handle products without optional fields", async () => {
      const minimalProduct: CreateProductType = {
        name: "Minimal Product",
        slug: "minimal-product",
        description: "Description",
        price: 50,
        stock: 10,
        active: true,
        categoryId: "cat-1",
      };

      const createdProduct = {
        id: "2",
        name: minimalProduct.name,
        slug: minimalProduct.slug,
        description: minimalProduct.description,
        price: new Decimal("50.00"),
        currency: "USD",
        stock: minimalProduct.stock,
        active: minimalProduct.active,
        categoryId: minimalProduct.categoryId,
        colors: undefined,
        sizes: undefined,
        images: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.product.create).mockResolvedValue(createdProduct);

      const result = await saveProduct(minimalProduct);

      expect(result.id).toBe("2");
      expect(result.colors).toBeUndefined();
      expect(result.sizes).toBeUndefined();
    });

    it("should handle zero price and stock", async () => {
      const zeroProduct: CreateProductType = {
        ...validProduct,
        price: 0,
        stock: 0,
      };

      const createdProduct = {
        id: "3",
        name: zeroProduct.name,
        slug: zeroProduct.slug,
        description: zeroProduct.description,
        price: new Decimal("0.00"),
        currency: "USD",
        stock: zeroProduct.stock,
        active: zeroProduct.active,
        categoryId: zeroProduct.categoryId,
        colors: zeroProduct.colors,
        sizes: zeroProduct.sizes,
        images: zeroProduct.images,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.product.create).mockResolvedValue(createdProduct);

      const result = await saveProduct(zeroProduct);

      expect(result.price.toString()).toBe("0");
      expect(result.stock).toBe(0);
    });
  });

  describe("saveUpdatedProduct", () => {
    it("should update an existing product", async () => {
      const existingProduct = {
        id: "1",
        name: "Old Product",
        slug: "old-product",
        description: "Old description",
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

      const updateData: UpdateProductType = {
        name: "Updated Product",
        price: 150,
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct);

      const result = await saveUpdatedProduct("1", updateData);

      expect(result.name).toBe("Updated Product");
      expect(result.price).toBe(150);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: updateData,
      });
    });

    it("should throw error if product does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const updateData: UpdateProductType = { name: "Updated Product" };

      await expect(
        saveUpdatedProduct("nonexistent", updateData),
      ).rejects.toThrow("Product not found");
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it("should handle partial updates", async () => {
      const existingProduct = {
        id: "1",
        name: "Product",
        slug: "product",
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

      const updateData: UpdateProductType = { stock: 5 };

      const updatedProduct = {
        ...existingProduct,
        stock: 5,
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct);

      const result = await saveUpdatedProduct("1", updateData);

      expect(result.stock).toBe(5);
      expect(result.name).toBe("Product"); // Other fields remain unchanged
    });

    it("should update slug and check for conflicts", async () => {
      const existingProduct = {
        id: "1",
        name: "Product",
        slug: "product",
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

      const updateData: UpdateProductType = { slug: "new-product" };

      const updatedProduct = {
        ...existingProduct,
        slug: "new-product",
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
        existingProduct,
      );
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null); // No conflict
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct);

      const result = await saveUpdatedProduct("1", updateData);

      expect(result.slug).toBe("new-product");
    });

    it("should throw error if new slug conflicts with another product", async () => {
      const existingProduct = {
        id: "1",
        name: "Product",
        slug: "product",
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

      const conflictingProduct = {
        id: "2",
        name: "Another Product",
        slug: "another-product",
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

      const updateData: UpdateProductType = { slug: "another-product" };

      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
        existingProduct,
      );
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
        conflictingProduct,
      );

      await expect(saveUpdatedProduct("1", updateData)).rejects.toThrow(
        "Another product with this slug already exists",
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it("should allow updating to same slug", async () => {
      const existingProduct = {
        id: "1",
        name: "Product",
        slug: "product",
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

      const updateData: UpdateProductType = {
        slug: "product",
        name: "Updated Product",
      };

      const updatedProduct = {
        ...existingProduct,
        name: "Updated Product",
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
        existingProduct,
      );
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(
        existingProduct,
      ); // Same product
      vi.mocked(prisma.product.update).mockResolvedValue(updatedProduct);

      const result = await saveUpdatedProduct("1", updateData);

      expect(result.name).toBe("Updated Product");
      expect(prisma.product.update).toHaveBeenCalled();
    });
  });

  describe("saveDeletedProduct", () => {
    it("should soft delete a product by marking active as false", async () => {
      const existingProduct = {
        id: "1",
        name: "Product",
        slug: "product",
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

      const deletedProduct = {
        ...existingProduct,
        active: false,
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(existingProduct);
      vi.mocked(prisma.product.update).mockResolvedValue(deletedProduct);

      await saveDeletedProduct("1");

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { active: false },
      });
    });

    it("should throw error if product does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(saveDeletedProduct("nonexistent")).rejects.toThrow(
        "Product not found",
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it("should handle deleting already inactive products", async () => {
      const inactiveProduct = {
        id: "1",
        name: "Product",
        slug: "product",
        description: "Description",
        price: new Decimal("100.00"),
        currency: "USD",
        stock: 10,
        active: false,
        categoryId: "cat-1",
        colors: [],
        sizes: [],
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.product.findUnique).mockResolvedValue(inactiveProduct);
      vi.mocked(prisma.product.update).mockResolvedValue(inactiveProduct);

      await saveDeletedProduct("1");

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { active: false },
      });
    });
  });
});
