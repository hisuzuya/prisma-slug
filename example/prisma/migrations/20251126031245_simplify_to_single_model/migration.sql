/*
  Warnings:

  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Page` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Article_slug_key";

-- DropIndex
DROP INDEX "Category_slug_key";

-- DropIndex
DROP INDEX "Event_slug_key";

-- DropIndex
DROP INDEX "Page_slug_key";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "Tag_slug_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Article";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Event";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Page";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tag";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "slug" TEXT NOT NULL DEFAULT '',
    "slugWithPrefix" TEXT NOT NULL DEFAULT '',
    "slugWithPostfix" TEXT NOT NULL DEFAULT '',
    "slugWithBoth" TEXT NOT NULL DEFAULT '',
    "slugShort" TEXT NOT NULL DEFAULT '',
    "slugRandom" TEXT NOT NULL DEFAULT '',
    "slugRequired" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "id", "published", "slug", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "published", "slug", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
CREATE UNIQUE INDEX "Post_slugWithPrefix_key" ON "Post"("slugWithPrefix");
CREATE UNIQUE INDEX "Post_slugWithPostfix_key" ON "Post"("slugWithPostfix");
CREATE UNIQUE INDEX "Post_slugWithBoth_key" ON "Post"("slugWithBoth");
CREATE UNIQUE INDEX "Post_slugShort_key" ON "Post"("slugShort");
CREATE UNIQUE INDEX "Post_slugRandom_key" ON "Post"("slugRandom");
CREATE UNIQUE INDEX "Post_slugRequired_key" ON "Post"("slugRequired");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
