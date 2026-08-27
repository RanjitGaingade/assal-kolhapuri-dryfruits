const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");

const app = express();

const PORT = process.env.PORT || 3000;

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const S3_BUCKET = process.env.S3_PRODUCT_IMAGES_BUCKET;

if (!S3_BUCKET) {
  console.warn(
    "WARNING: S3_PRODUCT_IMAGES_BUCKET environment variable is not set.",
  );
}

// ========================================
// PRISMA / POSTGRESQL
// ========================================

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(
      path.join(__dirname, "certs", "global-bundle.pem"),
      "utf8",
    ),
  },
});

const prisma = new PrismaClient({
  adapter,
});

// ========================================
// AWS S3
// ========================================

const s3 = new S3Client({
  region: AWS_REGION,
});

// ========================================
// MULTER
// ========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
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
    service: "assal-api",
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
// GET ALL PRODUCTS
// ========================================

app.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    const productsWithImageUrls = await Promise.all(
      products.map(async (product) => {
        if (!product.image || !S3_BUCKET) {
          return product;
        }

        const command = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: product.image,
        });

        const imageUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600,
        });

        return {
          ...product,
          image: imageUrl,
        };
      }),
    );

    res.json(productsWithImageUrls);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

// ========================================
// GET ALL PRODUCTS - API
// ========================================

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    const productsWithImageUrls = await Promise.all(
      products.map(async (product) => {
        if (!product.image || !S3_BUCKET) {
          return product;
        }

        const command = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: product.image,
        });

        const imageUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600,
        });

        return {
          ...product,
          image: imageUrl,
        };
      }),
    );

    res.json(productsWithImageUrls);
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

app.post("/products", upload.single("image"), async (req, res) => {
  let s3Key = null;

  try {
    if (!S3_BUCKET) {
      return res.status(500).json({
        error: "S3 product image bucket is not configured",
      });
    }

    const { name, sku, category, purchasePrice, sellingPrice, stockQuantity } =
      req.body;

    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        error:
          "name, sku, category, purchasePrice and sellingPrice are required",
      });
    }

    // ----------------------------------------
    // Upload image to S3 if provided
    // ----------------------------------------

    if (req.file) {
      const extension =
        path.extname(req.file.originalname).toLowerCase() || ".jpg";

      const uniqueName = `${crypto.randomUUID()}${extension}`;

      s3Key = `products/${uniqueName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        }),
      );
    }

    // ----------------------------------------
    // Create product in PostgreSQL
    // ----------------------------------------

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        purchasePrice,
        sellingPrice,
        stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
        image: s3Key,
      },
    });

    // ----------------------------------------
    // Return product with presigned image URL
    // ----------------------------------------

    let responseProduct = product;

    if (product.image && S3_BUCKET) {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: product.image,
      });

      const imageUrl = await getSignedUrl(s3, command, {
        expiresIn: 3600,
      });

      responseProduct = {
        ...product,
        image: imageUrl,
      };
    }

    res.status(201).json(responseProduct);
  } catch (error) {
    console.error("Failed to create product:", error);

    // ----------------------------------------
    // Cleanup S3 if DB insert failed
    // ----------------------------------------

    if (s3Key && S3_BUCKET) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
          }),
        );

        console.log("Cleaned up uploaded S3 image:", s3Key);
      } catch (cleanupError) {
        console.error("Failed to clean up S3 image:", cleanupError);
      }
    }

    res.status(500).json({
      error: "Failed to create product",
    });
  }
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
  try {
    await prisma.$connect();

    console.log("========================================");
    console.log("Database connection successful");
    console.log("========================================");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Assal API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("========================================");
    console.error("Database connection failed");
    console.error("========================================");
    console.error(error);

    process.exit(1);
  }
}

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
