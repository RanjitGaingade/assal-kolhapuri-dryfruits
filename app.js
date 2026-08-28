const express = require("express");
const fs = require("fs");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();

// ========================================
// PRISMA / POSTGRESQL
// ========================================

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(
      path.join(__dirname, "certs", "global-bundle.pem"),
      "utf8"
    ),
  },
});

const prisma = new PrismaClient({
  adapter,
});

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.static("public"));

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.sendFile("index.html", {
    root: "public",
  });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
  });
});

// ========================================
// API HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    application: "Assal Kolhapuri Dryfruits",
    status: "running",
  });
});

// ========================================
// GET PRODUCTS
// ========================================

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    res.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

// ========================================
// GET PRODUCTS - API
// ========================================

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    const formattedProducts = products.map((product) => {
      let image = product.image;

      if (image) {
        // Convert Markdown-style S3 URL to a plain URL
        const match = image.match(/\]\((https?:\/\/[^)]+)\)/);

        if (match) {
          image = match[1];
        } else {
          // Remove brackets if the value is simply [URL]
          image = image.replace(/^\[|\]$/g, "");
        }
      }

      return {
        ...product,
        image,
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});



// ========================================
// CREATE PRODUCT
// ========================================

app.post("/products", async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: req.body,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Failed to create product:", error);

    res.status(500).json({
      error: "Failed to create product",
    });
  }
});

module.exports = app;
