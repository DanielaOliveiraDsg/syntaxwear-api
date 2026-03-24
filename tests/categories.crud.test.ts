import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../src/utils/prisma";
import {
  getCategories,
  getCategoryById,
  createCategory,
  saveUpdatedCategory,
  deleteCategory,
} from "../src/services/categories.service";
import {
  CreateCategoryType,
  UpdateCategoryType,
  CategoryFilter,
} from "../src/types";

// Mock Prisma
vi.mock("../src/utils/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Categories CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getCategories", () => {
    it("should list all categories with default pagination", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Electronics",
          slug: "electronics",
          description: "Electronic products",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        {
          id: "2",
          name: "Clothing",
          slug: "clothing",
          description: "Clothing items",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories);
      vi.mocked(prisma.category.count).mockResolvedValue(2);

      const result = await getCategories({ page: 1, limit: 10 });

      expect(result.categories).toEqual(mockCategories);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(prisma.category.count).toHaveBeenCalled();
    });

    it("should filter categories by active status", async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.count).mockResolvedValue(0);

      const filter: CategoryFilter = { active: true, page: 1, limit: 10 };
      await getCategories(filter);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
          }),
        }),
      );
    });

    it("should search categories by name and description", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Electronics",
          slug: "electronics",
          description: "Electronic products",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories);
      vi.mocked(prisma.category.count).mockResolvedValue(1);

      const filter: CategoryFilter = {
        search: "electronics",
        page: 1,
        limit: 10,
      };
      const result = await getCategories(filter);

      expect(result.categories).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "electronics", mode: "insensitive" } },
              { description: { contains: "electronics", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should handle pagination correctly", async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.count).mockResolvedValue(35);

      const filter: CategoryFilter = { page: 2, limit: 10 };
      const result = await getCategories(filter);

      expect(result.meta.totalPages).toBe(4);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2 - 1) * 10
          take: 10,
        }),
      );
    });

    it("should order categories by name ascending", async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.count).mockResolvedValue(0);

      await getCategories({ page: 1, limit: 10 });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        }),
      );
    });

    it("should combine search and active filters", async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);
      vi.mocked(prisma.category.count).mockResolvedValue(0);

      const filter: CategoryFilter = {
        search: "clothing",
        active: true,
        page: 1,
        limit: 10,
      };
      await getCategories(filter);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
            OR: [
              { name: { contains: "clothing", mode: "insensitive" } },
              { description: { contains: "clothing", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("getCategoryById", () => {
    it("should retrieve a category by ID with product count", async () => {
      const mockCategory = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronic products",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 5 },
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

      const result = await getCategoryById("1");

      expect(result).toEqual(mockCategory);
      expect(result._count.products).toBe(5);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it("should throw error when category not found", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(getCategoryById("nonexistent")).rejects.toThrow(
        "Category not found",
      );
    });

    it("should include product count in response", async () => {
      const mockCategory = {
        id: "1",
        name: "Clothing",
        slug: "clothing",
        description: "Clothing items",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 10 },
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

      const result = await getCategoryById("1");

      expect(result._count).toBeDefined();
      expect(result._count.products).toBe(10);
    });

    it("should handle category with no products", async () => {
      const mockCategory = {
        id: "1",
        name: "Accessories",
        slug: "accessories",
        description: "Accessories items",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

      const result = await getCategoryById("1");

      expect(result._count.products).toBe(0);
    });
  });

  describe("createCategory", () => {
    const validCategory: CreateCategoryType = {
      name: "New Category",
      slug: "new-category",
      description: "Category description",
      active: true,
    };

    it("should create a new category", async () => {
      const createdCategory = {
        id: "1",
        ...validCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.create).mockResolvedValue(createdCategory);

      const result = await createCategory(validCategory);

      expect(result).toEqual(createdCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: "new-category" },
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: validCategory,
      });
    });

    it("should throw error if slug already exists", async () => {
      const existingCategory = {
        id: "1",
        name: validCategory.name,
        slug: validCategory.slug,
        description: validCategory.description,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);

      await expect(createCategory(validCategory)).rejects.toThrow(
        "Category with this slug already exists",
      );
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    it("should handle categories without description", async () => {
      const minimalCategory: CreateCategoryType = {
        name: "Minimal Category",
        slug: "minimal-category",
      };

      const createdCategory = {
        id: "2",
        name: minimalCategory.name,
        slug: minimalCategory.slug,
        description: undefined,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.create).mockResolvedValue(createdCategory);

      const result = await createCategory(minimalCategory);

      expect(result.id).toBe("2");
      expect(result.description).toBeUndefined();
    });

    it("should set active default to true", async () => {
      const categoryNoActive: CreateCategoryType = {
        name: "Test Category",
        slug: "test-category",
        description: "Test",
      };

      const createdCategory = {
        id: "3",
        name: categoryNoActive.name,
        slug: categoryNoActive.slug,
        description: categoryNoActive.description,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.create).mockResolvedValue(createdCategory);

      const result = await createCategory(categoryNoActive);

      expect(result.active).toBe(true);
    });
  });

  describe("saveUpdatedCategory", () => {
    it("should update an existing category", async () => {
      const existingCategory = {
        id: "1",
        name: "Old Category",
        slug: "old-category",
        description: "Old description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData: UpdateCategoryType = {
        name: "Updated Category",
        description: "Updated description",
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateData,
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

      const result = await saveUpdatedCategory("1", updateData);

      expect(result.name).toBe("Updated Category");
      expect(result.description).toBe("Updated description");
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: updateData,
      });
    });

    it("should throw error if category does not exist", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const updateData: UpdateCategoryType = { name: "Updated Category" };

      await expect(
        saveUpdatedCategory("nonexistent", updateData),
      ).rejects.toThrow("Category not found");
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it("should handle partial updates", async () => {
      const existingCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData: UpdateCategoryType = { active: false };

      const updatedCategory = {
        ...existingCategory,
        active: false,
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

      const result = await saveUpdatedCategory("1", updateData);

      expect(result.active).toBe(false);
      expect(result.name).toBe("Category");
    });

    it("should update slug and check for conflicts", async () => {
      const existingCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData: UpdateCategoryType = { slug: "new-category" };

      const updatedCategory = {
        ...existingCategory,
        slug: "new-category",
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

      const result = await saveUpdatedCategory("1", updateData);

      expect(result.slug).toBe("new-category");
    });

    it("should throw error if new slug conflicts with another category", async () => {
      const existingCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const conflictingCategory = {
        id: "2",
        name: "Another Category",
        slug: "another-category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData: UpdateCategoryType = { slug: "another-category" };

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(
        conflictingCategory,
      );

      await expect(saveUpdatedCategory("1", updateData)).rejects.toThrow(
        "Another category with this slug already exists",
      );
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it("should allow updating to same slug", async () => {
      const existingCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const updateData: UpdateCategoryType = {
        slug: "category",
        name: "Updated Category",
      };

      const updatedCategory = {
        ...existingCategory,
        name: "Updated Category",
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.update).mockResolvedValue(updatedCategory);

      const result = await saveUpdatedCategory("1", updateData);

      expect(result.name).toBe("Updated Category");
      expect(prisma.category.update).toHaveBeenCalled();
    });
  });

  describe("deleteCategory", () => {
    it("should soft delete a category by marking active as false", async () => {
      const existingCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      } as any;

      const deletedCategory = {
        ...existingCategory,
        active: false,
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(existingCategory);
      vi.mocked(prisma.category.update).mockResolvedValue(deletedCategory);

      const result = await deleteCategory("1");

      expect(result.success).toBe(true);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { active: false },
      });
    });

    it("should throw error if category not found", async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(deleteCategory("nonexistent")).rejects.toThrow(
        "Category not found",
      );
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it("should throw error if category has associated products", async () => {
      const categoryWithProducts = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 5 },
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(
        categoryWithProducts,
      );

      await expect(deleteCategory("1")).rejects.toThrow(
        "Cannot delete category with associated products",
      );
      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it("should allow deleting category with no products", async () => {
      const categoryNoProducts = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      } as any;

      const deletedCategory = {
        ...categoryNoProducts,
        active: false,
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(
        categoryNoProducts,
      );
      vi.mocked(prisma.category.update).mockResolvedValue(deletedCategory);

      const result = await deleteCategory("1");

      expect(result.success).toBe(true);
    });

    it("should handle deleting already inactive categories", async () => {
      const inactiveCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Description",
        active: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      } as any;

      vi.mocked(prisma.category.findUnique).mockResolvedValue(inactiveCategory);
      vi.mocked(prisma.category.update).mockResolvedValue(inactiveCategory);

      const result = await deleteCategory("1");

      expect(result.success).toBe(true);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { active: false },
      });
    });
  });
});
