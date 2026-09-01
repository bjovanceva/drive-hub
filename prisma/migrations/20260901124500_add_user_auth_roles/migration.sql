-- Existing student accounts become ordinary application users. Whether a user
-- is a student, instructor, or manager is represented by school relations.
ALTER TYPE "UserRole" RENAME VALUE 'STUDENT' TO 'USER';

-- A school can have one manager, and a user can manage at most one school.
ALTER TABLE "DrivingSchool" ADD COLUMN "managerId" INTEGER;

CREATE UNIQUE INDEX "DrivingSchool_managerId_key"
ON "DrivingSchool"("managerId");

ALTER TABLE "DrivingSchool"
ADD CONSTRAINT "DrivingSchool_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
