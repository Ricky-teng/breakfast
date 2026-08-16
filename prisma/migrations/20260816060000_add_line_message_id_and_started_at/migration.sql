-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "lineMessageId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Message_lineMessageId_key" ON "Message"("lineMessageId");
