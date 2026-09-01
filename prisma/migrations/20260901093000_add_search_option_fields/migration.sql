-- Add structured values needed to build search options from persisted data.
ALTER TABLE "DrivingSchool" ADD COLUMN "city" TEXT;
ALTER TABLE "Category" ADD COLUMN "code" TEXT;

-- Preserve existing installations: infer a city from the final comma-separated
-- address segment and recognize category rows that already use legal codes.
UPDATE "DrivingSchool"
SET "city" = NULLIF(BTRIM(REGEXP_REPLACE("address", '^.*,', '')), '');

UPDATE "Category"
SET "code" = UPPER("name")
WHERE UPPER("name") IN (
  'AM', 'A1', 'A2', 'A', 'B', 'BE', 'C1', 'C1E', 'C', 'CE',
  'D1', 'D1E', 'D', 'DE', 'F', 'G', 'T'
);

CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");
