const request = require("supertest");

const mockFindMany = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    product: {
      findMany: mockFindMany
    }
  }))
}));

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(() => ({}))
}));

const { app } = require("../app");

describe("API Endpoints", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // HEALTH CHECK
  // ========================================

  describe("GET /health", () => {

    test("should return healthy status", async () => {

      const response = await request(app)
        .get("/health");

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual({
        status: "healthy"
      });

    });

  });


  // ========================================
  // PRODUCTS
  // ========================================

  describe("GET /api/products", () => {

    test("should return all products", async () => {

      const products = [
        {
          id: 1,
          name: "Premium Almonds",
          sku: "ALM-500",
          category: "Dry Fruits",
          purchasePrice: "400",
          sellingPrice: "500",
          stockQuantity: 20
        },
        {
          id: 2,
          name: "Kaju",
          sku: "KAJ-500",
          category: "Dry Fruits",
          purchasePrice: "450",
          sellingPrice: "550",
          stockQuantity: 15
        }
      ];

      mockFindMany.mockResolvedValue(products);

      const response = await request(app)
        .get("/api/products");

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual(products);

      expect(mockFindMany).toHaveBeenCalledTimes(1);

    });


    test("should return empty array when there are no products", async () => {

      mockFindMany.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/products");

      expect(response.statusCode).toBe(200);

      expect(response.body).toEqual([]);

    });


    test("should return 500 when database query fails", async () => {

      mockFindMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .get("/api/products");

      expect(response.statusCode).toBe(500);

      expect(response.body).toEqual({
        error: "Failed to fetch products"
      });

    });

  });

});