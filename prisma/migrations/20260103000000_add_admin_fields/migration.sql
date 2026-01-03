-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "AdminStatus" AS ENUM ('available', 'busy', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('pending', 'broadcasted', 'accepted', 'declined', 'in_progress', 'completed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add name column if not exists
DO $$ BEGIN
    ALTER TABLE "Admin" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Admin';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add status column if not exists
DO $$ BEGIN
    ALTER TABLE "Admin" ADD COLUMN "status" "AdminStatus" NOT NULL DEFAULT 'available';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateTable "Order" if not exists
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "assignedAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable "OrderDecline" if not exists
CREATE TABLE IF NOT EXISTS "OrderDecline" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDecline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (if not exists)
DO $$ BEGIN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UserRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
    ALTER TABLE "OrderDecline" ADD CONSTRAINT "OrderDecline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
    ALTER TABLE "OrderDecline" ADD CONSTRAINT "OrderDecline_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "OrderDecline_orderId_adminId_key" ON "OrderDecline"("orderId", "adminId");
