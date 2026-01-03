-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Admin';

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('available', 'busy', 'offline');

-- AlterTable - Add status column with default as TEXT first
ALTER TABLE "Admin" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'available';

-- AlterTable - Convert status to AdminStatus enum
ALTER TABLE "Admin" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Admin" ALTER COLUMN "status" TYPE "AdminStatus" USING "status"::"AdminStatus";
ALTER TABLE "Admin" ALTER COLUMN "status" SET DEFAULT 'available'::"AdminStatus";

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'broadcasted', 'accepted', 'declined', 'in_progress', 'completed', 'expired');

-- CreateTable "Order"
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "assignedAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable "OrderDecline"
CREATE TABLE "OrderDecline" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDecline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UserRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDecline" ADD CONSTRAINT "OrderDecline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDecline" ADD CONSTRAINT "OrderDecline_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "OrderDecline_orderId_adminId_key" ON "OrderDecline"("orderId", "adminId");
