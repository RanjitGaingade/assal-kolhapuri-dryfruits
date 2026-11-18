
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const app = express();
const PORT = Number(process.env.ADMIN_PORT || 3001);

const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

if (!USERNAME || !PASSWORD_HASH || !SESSION_SECRET) {
  throw new Error("Admin credentials and session secret must be configured.");
}

if (SESSION_SECRET.length < 32) {
  throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
}

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

const prisma = new PrismaClient({ adapter });

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

const COOKIE_NAME = "assal_admin_session";
const SESSION_DURATION = 8 * 60 * 60;

const allowedOrigins = new Set([
  "http://localhost:3001",
  "http://127.0.0.1:3001",
]);

const loginAttempts = new Map();

function passwordMatches(password) {
  const parts = PASSWORD_HASH.split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  try {
    const expected = Buffer.from(parts[2], "hex");
    const actual = crypto.scryptSync(password, parts[1], expected.length);

    return (
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}

function sign(payload) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

function createSession(username) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function getCookies(req) {
  const result = {};

  for (const item of (req.headers.cookie || "").split(";")) {
    const index = item.indexOf("=");

    if (index > 0) {
      result[item.slice(0, index).trim()] = item
        .slice(index + 1)
        .trim();
    }
  }

  return result;
}

function requireAdmin(req, res, next) {
  const token = getCookies(req)[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Admin login required." });
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Invalid session." });
  }

  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return res.status(401).json({ error: "Invalid session." });
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (
      session.sub !== USERNAME ||
      !Number.isInteger(session.exp) ||
      session.exp <= Math.floor(Date.now() / 1000)
    ) {
      return res.status(401).json({ error: "Session expired." });
    }

    req.admin = session.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session." });
  }
}

function requireLocalOrigin(req, res, next) {
  const origin = req.headers.origin;

  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Request origin not allowed." });
  }

  next();
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`
  );
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "private-admin" });
});

// Admin dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// Admin login
app.post("/api/login", requireLocalOrigin, (req, res) => {
  const address = req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const current = loginAttempts.get(address) || {
    count: 0,
    resetAt: now + 15 * 60 * 1000,
  };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + 15 * 60 * 1000;
  }

  if (current.count >= 5) {
    return res.status(429).json({
      error: "Too many login attempts. Try again in 15 minutes.",
    });
  }

  const { username, password } = req.body || {};

  const valid =
    typeof username === "string" &&
    typeof password === "string" &&
    username === USERNAME &&
    password.length <= 256 &&
    passwordMatches(password);

  if (!valid) {
    current.count += 1;
    loginAttempts.set(address, current);

    return res.status(401).json({
      error: "Invalid username or password.",
    });
  }

  loginAttempts.delete(address);
  setSessionCookie(res, createSession(USERNAME));

  res.json({ success: true, message: "Login successful." });
});

// Admin logout
app.post("/api/logout", requireLocalOrigin, requireAdmin, (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// Current admin session
app.get("/api/me", requireAdmin, (req, res) => {
  res.json({ authenticated: true, username: req.admin });
});

// List recent orders
app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    res.json({ orders });
  } catch (error) {
    console.error("Admin order listing failed:", error);
    res.status(500).json({ error: "Unable to load orders." });
  }
});

// Update order status and restore stock when an order is cancelled
app.patch(
  "/api/orders/:id/status",
  requireLocalOrigin,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        error: "Invalid order ID or status.",
      });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!current) {
          throw new Error("ORDER_NOT_FOUND");
        }

        // A previously cancelled order must never restore stock twice.
        if (current.status === "CANCELLED") {
          if (status !== "CANCELLED") {
            throw new Error("ORDER_ALREADY_CANCELLED");
          }

          return current;
        }

        // Shipped and delivered orders require a separate returns process.
        if (
          status === "CANCELLED" &&
          ["SHIPPED", "DELIVERED"].includes(current.status)
        ) {
          throw new Error("ORDER_CANNOT_BE_CANCELLED");
        }

        if (status === "CANCELLED") {
          // Atomically claim the cancellation before restoring stock.
          const claimed = await tx.order.updateMany({
            where: {
              id,
              status: current.status,
            },
            data: {
              status: "CANCELLED",
            },
          });

          if (claimed.count !== 1) {
            throw new Error("ORDER_STATUS_CHANGED");
          }

          // Combine quantities in case an order has repeated product lines.
          const quantitiesByProduct = new Map();

          for (const item of current.items) {
            quantitiesByProduct.set(
              item.productId,
              (quantitiesByProduct.get(item.productId) || 0) +
                item.quantity
            );
          }

          // Restore stock inside the same transaction.
          for (const [productId, quantity] of quantitiesByProduct) {
            await tx.product.update({
              where: { id: productId },
              data: {
                stockQuantity: {
                  increment: quantity,
                },
              },
            });
          }

          return await tx.order.findUnique({
            where: { id },
            include: { items: true },
          });
        }

        // Normal status update when the order is not being cancelled.
        const updated = await tx.order.updateMany({
          where: {
            id,
            status: current.status,
          },
          data: { status },
        });

        if (updated.count !== 1) {
          throw new Error("ORDER_STATUS_CHANGED");
        }

        return await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });
      });

      res.json({ success: true, order });
    } catch (error) {
      if (
        error.message === "ORDER_NOT_FOUND" ||
        error.code === "P2025"
      ) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      if (error.message === "ORDER_ALREADY_CANCELLED") {
        return res.status(409).json({
          error: "This order is already cancelled and cannot be reopened.",
        });
      }

      if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
        return res.status(409).json({
          error: "Shipped or delivered orders cannot be cancelled here.",
        });
      }

      if (error.message === "ORDER_STATUS_CHANGED") {
        return res.status(409).json({
          error: "Order status changed. Refresh and try again.",
        });
      }

      console.error("Admin order update failed:", error);

      res.status(500).json({
        error: "Unable to update order.",
      });
    }
  }
);

// List products
app.get("/api/products", requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });

    res.json({ products });
  } catch (error) {
    console.error("Admin product listing failed:", error);

    res.status(500).json({
      error: "Unable to load products.",
    });
  }
});

// Manually update product stock
app.patch(
  "/api/products/:id/stock",
  requireLocalOrigin,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const { stockQuantity } = req.body || {};

    if (
      !Number.isSafeInteger(id) ||
      id < 1 ||
      !Number.isSafeInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      return res.status(400).json({
        error: "Invalid product ID or stock quantity.",
      });
    }

    try {
      const product = await prisma.product.update({
        where: { id },
        data: { stockQuantity },
      });

      res.json({ success: true, product });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Product not found.",
        });
      }

      console.error("Admin stock update failed:", error);

      res.status(500).json({
        error: "Unable to update stock.",
      });
    }
  }
);

// Start admin server
async function startAdminServer() {
  await prisma.$connect();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Private admin service listening on port ${PORT}`);
  });
}

startAdminServer().catch((error) => {
  console.error("Private admin service failed to start:", error);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
