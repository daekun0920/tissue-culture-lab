-- AlterTable
ALTER TABLE "action_logs" ADD COLUMN "metadata" TEXT DEFAULT '{}';
ALTER TABLE "action_logs" ADD COLUMN "new_status" TEXT;
ALTER TABLE "action_logs" ADD COLUMN "previous_status" TEXT;

-- AlterTable
ALTER TABLE "media_batches" ADD COLUMN "batch_number" TEXT;
ALTER TABLE "media_batches" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "container_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "material" TEXT,
    "is_vented" BOOLEAN NOT NULL DEFAULT false,
    "is_reusable" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" DATETIME,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "experiments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "experiment_cultures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experiment_id" TEXT NOT NULL,
    "container_qr" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "experiment_cultures_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "experiment_cultures_container_qr_fkey" FOREIGN KEY ("container_qr") REFERENCES "containers" ("qr_code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "experiment_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experiment_id" TEXT NOT NULL,
    "entryType" TEXT NOT NULL DEFAULT 'log',
    "content" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiment_entries_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "experiment_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_containers" (
    "qr_code" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'EMPTY',
    "container_type_id" TEXT,
    "media_id" TEXT,
    "culture_id" TEXT,
    "parent_id" TEXT,
    "notes" TEXT,
    "culture_date" DATETIME,
    "subculture_interval" INTEGER,
    "due_subculture_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "containers_container_type_id_fkey" FOREIGN KEY ("container_type_id") REFERENCES "container_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "containers_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "containers_culture_id_fkey" FOREIGN KEY ("culture_id") REFERENCES "culture_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "containers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "containers" ("qr_code") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_containers" ("culture_id", "media_id", "parent_id", "qr_code", "status", "updated_at") SELECT "culture_id", "media_id", "parent_id", "qr_code", "status", "updated_at" FROM "containers";
DROP TABLE "containers";
ALTER TABLE "new_containers" RENAME TO "containers";
CREATE TABLE "new_culture_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "clone" TEXT,
    "origin" TEXT,
    "default_subculture_interval" INTEGER NOT NULL DEFAULT 28
);
INSERT INTO "new_culture_types" ("id", "name") SELECT "id", "name" FROM "culture_types";
DROP TABLE "culture_types";
ALTER TABLE "new_culture_types" RENAME TO "culture_types";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "experiment_cultures_experiment_id_container_qr_key" ON "experiment_cultures"("experiment_id", "container_qr");
