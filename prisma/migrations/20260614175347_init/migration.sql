-- CreateTable
CREATE TABLE "Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalBucket" TEXT NOT NULL,
    "originalObjectKey" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "stickerBucket" TEXT,
    "stickerObjectKey" TEXT,
    "stickerUrl" TEXT,
    "thumbnailUrl" TEXT,
    "ocrText" TEXT,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "Image"("status");

-- CreateIndex
CREATE INDEX "Image_category_idx" ON "Image"("category");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");
