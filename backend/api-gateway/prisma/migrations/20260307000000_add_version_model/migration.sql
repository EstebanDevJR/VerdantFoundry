-- CreateTable
CREATE TABLE "Version" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "change_summary" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Version_entity_type_entity_id_idx" ON "Version"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "Version_entity_type_entity_id_version_key" ON "Version"("entity_type", "entity_id", "version");

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
