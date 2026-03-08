-- CreateTable
CREATE TABLE "containers" (
    "qr_code" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'EMPTY',
    "media_id" TEXT,
    "culture_id" TEXT,
    "parent_id" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "containers_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "containers_culture_id_fkey" FOREIGN KEY ("culture_id") REFERENCES "culture_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "containers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "containers" ("qr_code") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "base_type" TEXT NOT NULL,
    "ph_level" REAL NOT NULL,
    "agar" REAL NOT NULL,
    "hormones" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "media_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipe_id" TEXT NOT NULL,
    "date_prep" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "media_batches_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "media_recipes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "culture_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "action_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "container_qr" TEXT NOT NULL,
    "note" TEXT,
    CONSTRAINT "action_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "action_logs_container_qr_fkey" FOREIGN KEY ("container_qr") REFERENCES "containers" ("qr_code") ON DELETE RESTRICT ON UPDATE CASCADE
);
