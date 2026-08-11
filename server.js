const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();

const PORT = process.env.PORT || 3000;

// Prisma
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

// Middleware
app.use(express.json());

// Serve homepage and static files
app.use(express.static("public"));

// Homepage
app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: "public"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    application: "Assal Kolhapuri Dryfruits",
    status: "running"
  });
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});

// Get all products - API
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});

// Create a product
app.post("/products", async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      stockQuantity
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        purchasePrice,
        sellingPrice,
        stockQuantity
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Failed to create product:", error);

    res.status(500).json({
      error: "Failed to create product"
    });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "Assal Kolhapuri Dryfruits API running on port " + PORT
  );
});
