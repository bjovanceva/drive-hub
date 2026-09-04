-- Older local databases may predate the preferred-instructor migration.
-- This is additive and safe on databases where the column already exists.
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "preferredInstructorId" INTEGER;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Application"'::regclass
      AND conname = 'Application_preferredInstructorId_fkey'
  ) THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_preferredInstructorId_fkey"
      FOREIGN KEY ("preferredInstructorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Application_preferredInstructorId_idx" ON "Application"("preferredInstructorId");
