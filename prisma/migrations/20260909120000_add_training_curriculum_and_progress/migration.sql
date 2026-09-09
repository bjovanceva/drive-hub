-- Curriculum definitions are shared by every school that offers a category.
CREATE TYPE "LessonType" AS ENUM ('THEORY', 'PRACTICAL');

-- PAUSED enrollments still reserve an instructor place.
CREATE TYPE "TrainingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "LessonSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "CurriculumLesson" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "LessonType" NOT NULL,
    "title" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,

    CONSTRAINT "CurriculumLesson_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CurriculumLesson_sequence_check" CHECK ("sequence" > 0),
    CONSTRAINT "CurriculumLesson_durationMinutes_check" CHECK ("durationMinutes" > 0)
);

CREATE TABLE "TrainingEnrollment" (
    "id" SERIAL NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "applicationId" INTEGER,
    "studentId" INTEGER NOT NULL,
    "drivingSchoolId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "vehicleId" INTEGER,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonSession" (
    "id" SERIAL NOT NULL,
    "status" "LessonSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "trainingEnrollmentId" INTEGER NOT NULL,
    "curriculumLessonId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "vehicleId" INTEGER,

    CONSTRAINT "LessonSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LessonSession_schedule_check" CHECK ("scheduledEnd" > "scheduledStart"),
    CONSTRAINT "LessonSession_completion_check" CHECK (
      ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL)
      OR ("status" <> 'COMPLETED')
    )
);

CREATE UNIQUE INDEX "CurriculumLesson_categoryId_sequence_key"
ON "CurriculumLesson"("categoryId", "sequence");
CREATE INDEX "CurriculumLesson_categoryId_type_idx"
ON "CurriculumLesson"("categoryId", "type");

CREATE UNIQUE INDEX "TrainingEnrollment_applicationId_key"
ON "TrainingEnrollment"("applicationId");
CREATE INDEX "TrainingEnrollment_studentId_status_idx"
ON "TrainingEnrollment"("studentId", "status");
CREATE INDEX "TrainingEnrollment_instructorId_status_idx"
ON "TrainingEnrollment"("instructorId", "status");
CREATE INDEX "TrainingEnrollment_drivingSchoolId_status_idx"
ON "TrainingEnrollment"("drivingSchoolId", "status");
CREATE INDEX "TrainingEnrollment_categoryId_idx"
ON "TrainingEnrollment"("categoryId");
CREATE INDEX "TrainingEnrollment_vehicleId_idx"
ON "TrainingEnrollment"("vehicleId");

CREATE INDEX "LessonSession_trainingEnrollmentId_curriculumLessonId_idx"
ON "LessonSession"("trainingEnrollmentId", "curriculumLessonId");
CREATE INDEX "LessonSession_trainingEnrollmentId_status_idx"
ON "LessonSession"("trainingEnrollmentId", "status");
CREATE INDEX "LessonSession_curriculumLessonId_idx"
ON "LessonSession"("curriculumLessonId");
CREATE INDEX "LessonSession_instructorId_idx"
ON "LessonSession"("instructorId");
CREATE INDEX "LessonSession_vehicleId_idx"
ON "LessonSession"("vehicleId");
CREATE INDEX "LessonSession_scheduledStart_scheduledEnd_idx"
ON "LessonSession"("scheduledStart", "scheduledEnd");

ALTER TABLE "CurriculumLesson" ADD CONSTRAINT "CurriculumLesson_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_drivingSchoolId_fkey"
FOREIGN KEY ("drivingSchoolId") REFERENCES "DrivingSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_trainingEnrollmentId_fkey"
FOREIGN KEY ("trainingEnrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_curriculumLessonId_fkey"
FOREIGN KEY ("curriculumLessonId") REFERENCES "CurriculumLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve already-approved applications as training records. Their instructor is
-- assigned the next time they are saved if no preference was recorded historically.
INSERT INTO "TrainingEnrollment"
  ("applicationId", "studentId", "drivingSchoolId", "categoryId", "instructorId", "startedAt")
SELECT
  application."id",
  application."userId",
  application."drivingSchoolId",
  application."categoryId",
  application."preferredInstructorId",
  application."startedAt"
FROM "Application" AS application
WHERE application."status" = 'APPROVED'
ON CONFLICT ("applicationId") DO NOTHING;
