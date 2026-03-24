import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FastifyRequest, FastifyReply } from "fastify";
import {
  listCategories,
  getCategory,
  createNewCategory,
  updateCategory,
  removeCategory,
} from "../src/controllers/categories.controller";
import * as categoriesService from "../src/services/categories.service";
import { CreateCategoryType, UpdateCategoryType } from "../src/types";

// Mock the service
vi.mock("../src/services/categories.service", () => ({
  getCategories: vi.fn(),
  getCategoryById: vi.fn(),
  createCategory: vi.fn(),
  saveUpdatedCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

// Mock slugify
vi.mock("slugify", () => ({
  default: (text: string) => text.toLowerCase().replace(/\s+/g, "-"),
}));

describe("Categories Controller", () => {
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

  describe("listCategories", () => {
    it("should list categories with default filters", async () => {
      mockRequest.query = {};

      const mockResult = {
        categories: [
          {
            id: "1",
            name: "Electronics",
            slug: "electronics",
            description: "Electronic products",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      vi.mocked(categoriesService.getCategories).mockResolvedValue(mockResult);

      await listCategories(mockRequest as any, mockReply as any);

      expect(categoriesService.getCategories).toHaveBeenCalledWith({});
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });

    it("should pass filters to service", async () => {
      mockRequest.query = {
        page: 2,
        limit: 20,
        search: "clothing",
        active: true,
      };

      vi.mocked(categoriesService.getCategories).mockResolvedValue({
        categories: [],
        meta: { total: 0, page: 2, limit: 20, totalPages: 0 },
      });

      await listCategories(mockRequest as any, mockReply as any);

      expect(categoriesService.getCategories).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "clothing",
        active: true,
      });
    });

    it("should handle service errors", async () => {
      mockRequest.query = {};

      const error = new Error("Database error");
      vi.mocked(categoriesService.getCategories).mockRejectedValue(error);

      await expect(
        listCategories(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getCategory", () => {
    it("should retrieve a category by ID", async () => {
      mockRequest.params = { id: "1" };

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

      vi.mocked(categoriesService.getCategoryById).mockResolvedValue(
        mockCategory,
      );

      await getCategory(mockRequest as any, mockReply as any);

      expect(categoriesService.getCategoryById).toHaveBeenCalledWith("1");
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(mockCategory);
    });

    it("should throw error if category not found", async () => {
      mockRequest.params = { id: "nonexistent" };

      vi.mocked(categoriesService.getCategoryById).mockRejectedValue(
        new Error("Category not found"),
      );

      await expect(
        getCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Category not found");
    });
  });

  describe("createNewCategory", () => {
    it("should create a new category", async () => {
      const bodyData = {
        name: "New Category",
        slug: "new-category",
        description: "Category description",
        active: true,
      };
      mockRequest.body = bodyData;

      vi.mocked(categoriesService.createCategory).mockResolvedValue({
        id: "1",
        ...bodyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await createNewCategory(mockRequest as any, mockReply as any);

      expect(mockReply.status).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalled();
      expect(categoriesService.createCategory).toHaveBeenCalled();
    });

    it("should handle duplicate slug error", async () => {
      mockRequest.body = {
        name: "Existing Category",
        slug: "existing-category",
        description: "Description",
        active: true,
      };

      vi.mocked(categoriesService.createCategory).mockRejectedValue(
        new Error("Category with this slug already exists"),
      );

      await expect(
        createNewCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Category with this slug already exists");
    });

    it("should handle validation errors", async () => {
      mockRequest.body = {
        // Missing required name field
        slug: "category",
      };

      // This will fail at validation layer (Zod)
      await expect(
        createNewCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow();
    });
  });

  describe("updateCategory", () => {
    it("should update a category", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "Updated Category",
        description: "Updated description",
      };

      const updatedCategory = {
        id: "1",
        name: "Updated Category",
        slug: "updated-category",
        description: "Updated description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(categoriesService.saveUpdatedCategory).mockResolvedValue(
        updatedCategory,
      );

      await updateCategory(mockRequest as any, mockReply as any);

      expect(categoriesService.saveUpdatedCategory).toHaveBeenCalledWith("1", {
        name: "Updated Category",
        description: "Updated description",
        slug: "updated-category",
      });
      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(updatedCategory);
    });

    it("should regenerate slug when name is updated", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "New Category Name",
      };

      const updatedCategory = {
        id: "1",
        name: "New Category Name",
        slug: "new-category-name",
        description: "Description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(categoriesService.saveUpdatedCategory).mockResolvedValue(
        updatedCategory,
      );

      await updateCategory(mockRequest as any, mockReply as any);

      const callArgs = vi.mocked(categoriesService.saveUpdatedCategory).mock
        .calls[0][1];
      expect(callArgs.slug).toBe("new-category-name");
    });

    it("should handle category not found error", async () => {
      mockRequest.params = { id: "nonexistent" };
      mockRequest.body = { name: "Updated Category" };

      vi.mocked(categoriesService.saveUpdatedCategory).mockRejectedValue(
        new Error("Category not found"),
      );

      await expect(
        updateCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Category not found");
    });

    it("should handle slug conflict error", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "Another Category" };

      vi.mocked(categoriesService.saveUpdatedCategory).mockRejectedValue(
        new Error("Another category with this slug already exists"),
      );

      await expect(
        updateCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Another category with this slug already exists");
    });

    it("should not regenerate slug if name is not updated", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        description: "Updated description",
      };

      const updatedCategory = {
        id: "1",
        name: "Category",
        slug: "category",
        description: "Updated description",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      vi.mocked(categoriesService.saveUpdatedCategory).mockResolvedValue(
        updatedCategory,
      );

      await updateCategory(mockRequest as any, mockReply as any);

      const callArgs = vi.mocked(categoriesService.saveUpdatedCategory).mock
        .calls[0][1];
      expect(callArgs.slug).toBeUndefined();
    });
  });

  describe("removeCategory", () => {
    it("should delete a category", async () => {
      mockRequest.params = { id: "1" };

      vi.mocked(categoriesService.deleteCategory).mockResolvedValue({
        success: true,
      });

      await removeCategory(mockRequest as any, mockReply as any);

      expect(categoriesService.deleteCategory).toHaveBeenCalledWith("1");
      expect(mockReply.status).toHaveBeenCalledWith(204);
    });

    it("should throw error if category not found", async () => {
      mockRequest.params = { id: "nonexistent" };

      vi.mocked(categoriesService.deleteCategory).mockRejectedValue(
        new Error("Category not found"),
      );

      await expect(
        removeCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Category not found");
    });

    it("should throw error if category has associated products", async () => {
      mockRequest.params = { id: "1" };

      vi.mocked(categoriesService.deleteCategory).mockRejectedValue(
        new Error("Cannot delete category with associated products"),
      );

      await expect(
        removeCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow("Cannot delete category with associated products");
    });

    it("should handle invalid category ID validation", async () => {
      mockRequest.params = { id: "" };

      // This will fail at validation layer (Zod)
      await expect(
        removeCategory(mockRequest as any, mockReply as any),
      ).rejects.toThrow();
    });
  });
});
