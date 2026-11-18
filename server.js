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


// ========================================
// GET ALL PRODUCTS - API
// ========================================

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    const productsWithImageUrls = products.map((product) => ({
      ...product,
      image:
        product.image && S3_BUCKET
          ? `/api/products/${product.id}/image`
          : product.image,
    }));

    res.json(productsWithImageUrls);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

// ========================================
// PRODUCT IMAGE
// ========================================


app.get("/api/products/:id/image", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      select: { image: true },
    });

    if (!product || !product.image || !S3_BUCKET) {
      return res.status(404).send("Image not found");
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: product.image,
    });

    const imageUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    res.redirect(imageUrl);
  } catch (error) {
    console.error("Failed to serve product image:", error);
    res.status(500).send("Failed to load image");
  }
});


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
      responseProduct = {
        ...product,
        image: `/api/products/${product.id}/image`,
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
// CREATE CUSTOMER ORDER
// ========================================

app.post("/api/orders", async (req, res) => {
  try {
    const customerName = String(req.body.customerName || "").trim();
    const mobile = String(req.body.mobile || "").trim();
    const address = String(req.body.address || "").trim();
    const city = String(req.body.city || "").trim();
    const pincode = String(req.body.pincode || "").trim();
    const submittedItems = req.body.items;

    if (!customerName || !mobile || !address || !city || !pincode) {
      return res.status(400).json({
        error: "Please provide all required customer details.",
      });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        error: "Please enter a valid 10-digit mobile number.",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        error: "Please enter a valid 6-digit pincode.",
      });
    }

    if (
      !Array.isArray(submittedItems) ||
      submittedItems.length === 0 ||
      submittedItems.length > 50
    ) {
      return res.status(400).json({
        error: "Your cart is empty or contains too many items.",
      });
    }

    // Combine duplicate product IDs and validate quantities.
    const quantities = new Map();

    for (const item of submittedItems) {
      const productId = Number(item.id);
      const quantity = Number(item.quantity);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        quantity > 100
      ) {
        return res.status(400).json({
          error: "The cart contains an invalid product or quantity.",
        });
      }

      const combinedQuantity = (quantities.get(productId) || 0) + quantity;

      if (combinedQuantity > 100) {
        return res.status(400).json({
          error: "The requested quantity is too high.",
        });
      }

      quantities.set(productId, combinedQuantity);
    }

    const order = await prisma.$transaction(
      async (tx) => {
        const productIds = Array.from(quantities.keys());

        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });

        if (products.length !== productIds.length) {
          throw new Error("ORDER_PRODUCT_NOT_FOUND");
        }

        let subtotalPaise = 0;
        const orderItems = [];

        for (const product of products) {
          const quantity = quantities.get(product.id);
          const unitPricePaise = Math.round(
            Number(product.sellingPrice) * 100
          );

          if (
            !Number.isSafeInteger(unitPricePaise) ||
            unitPricePaise < 0
          ) {
            throw new Error("ORDER_INVALID_PRODUCT_PRICE");
          }

          if (product.stockQuantity < quantity) {
            throw new Error("ORDER_OUT_OF_STOCK");
          }

          const lineTotalPaise = unitPricePaise * quantity;
          subtotalPaise += lineTotalPaise;

          orderItems.push({
            productId: product.id,
            productName: product.name,
            unitPrice: (unitPricePaise / 100).toFixed(2),
            quantity,
            lineTotal: (lineTotalPaise / 100).toFixed(2),
          });
        }

        if (!Number.isSafeInteger(subtotalPaise)) {
          throw new Error("ORDER_INVALID_TOTAL");
        }

        const deliveryPaise = subtotalPaise >= 99900 ? 0 : 5000;
        const totalPaise = subtotalPaise + deliveryPaise;

        // Reduce stock inside the transaction. Any failure rolls back
        // all stock changes and prevents the order from being saved.
        for (const item of orderItems) {
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: item.productId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          if (stockUpdate.count !== 1) {
            throw new Error("ORDER_OUT_OF_STOCK");
          }
        }

        const orderNumber =
          "AKD-" +
          Date.now() +
          "-" +
          crypto.randomBytes(3).toString("hex").toUpperCase();

        return await tx.order.create({
          data: {
            orderNumber,
            customerName,
            mobile,
            address,
            city,
            pincode,
            subtotal: (subtotalPaise / 100).toFixed(2),
            delivery: (deliveryPaise / 100).toFixed(2),
            total: (totalPaise / 100).toFixed(2),
            status: "PENDING",
            items: {
              create: orderItems,
            },
          },
          include: {
            items: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );

    return res.status(201).json({
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    if (error.message === "ORDER_PRODUCT_NOT_FOUND") {
      return res.status(400).json({
        error: "One or more products in your cart are no longer available.",
      });
    }

    if (error.message === "ORDER_OUT_OF_STOCK") {
      return res.status(409).json({
        error: "One or more products do not have enough stock. Please update your cart.",
      });
    }

    if (
      error.message === "ORDER_INVALID_PRODUCT_PRICE" ||
      error.message === "ORDER_INVALID_TOTAL"
    ) {
      return res.status(400).json({
        error: "A product price is invalid. Please contact us.",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        error: "Stock changed while placing your order. Please try again.",
      });
    }

    console.error("Failed to create order:", error);

    return res.status(500).json({
      error: "Unable to place your order right now. Please try again.",
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
