const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const app = express();
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    application: "Assal Kolhapuri Dryfruits",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});

// Get all products
app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    res.json(products);
  } catch (error) {
    console.error(error);

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
    console.error(error);

    res.status(500).json({
      error: "Failed to create product"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
