-- Subscriptions tablosuna created sütunu ekleme
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "created" TIMESTAMP WITH TIME ZONE;

-- Mevcut kayıtlar için created sütununu güncelleme
UPDATE "subscriptions" SET "created" = created_at WHERE "created" IS NULL;
