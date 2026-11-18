-- Create Order table
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "delivery" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Create OrderItem table
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "Order_orderNumber_key"
ON "Order"("orderNumber");

CREATE INDEX "OrderItem_orderId_idx"
ON "OrderItem"("orderId");

CREATE INDEX "OrderItem_productId_idx"
ON "OrderItem"("productId");

-- Create foreign keys
ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
