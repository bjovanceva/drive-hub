ALTER TABLE "Application" ADD COLUMN "preferredInstructorId" INTEGER;

ALTER TABLE "Application"
ADD CONSTRAINT "Application_preferredInstructorId_fkey"
FOREIGN KEY ("preferredInstructorId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Application_preferredInstructorId_idx" ON "Application"("preferredInstructorId");