const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
 ssl: {
    rejectUnauthorized: true,
    ca: require("fs").readFileSync(
      require("path").join(__dirname, "certs/global-bundle.pem"),
      "utf8"
    )
});
const prisma = new PrismaClient({
  adapter
});

app.use(express.json());

app.use(express.static("public"));


// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: "public"
  });
});


// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});


// ========================================
// API HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    application: "Assal Kolhapuri Dryfruits",
    status: "running"
  });
});


// ========================================
// GET PRODUCTS
// ========================================

app.get("/products", async (req, res) => {
  try {

    const products =
      await prisma.product.findMany();

    res.json(products);

  } catch (error) {

    console.error(
      "Failed to fetch products:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});


// ========================================
// GET PRODUCTS API
// ========================================

app.get("/api/products", async (req, res) => {
  try {

    const products =
      await prisma.product.findMany();

    res.json(products);

  } catch (error) {

    console.error(
      "Failed to fetch products:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});


// ========================================
// CREATE PRODUCT
// ========================================

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

    const product =
      await prisma.product.create({
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

    console.error(
      "Failed to create product:",
      error
    );

    res.status(500).json({
      error: "Failed to create product"
    });
  }
});


// ========================================
// EXPORT
// ========================================

module.exports = {
  app,
  prisma
};
