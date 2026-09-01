-- Idempotent seed for every North Macedonian driving-licence category.
--
-- Prices are the shared Drive Hub programme estimates displayed by the UI.
-- Lesson counts describe the standard programme stored by the current schema;
-- schools can be connected later through _CategoryToDrivingSchool.
INSERT INTO "Category" (
  "code",
  "name",
  "price",
  "theoryLessons",
  "practicalLessons",
  "minimumAge"
)
VALUES
  ('AM', 'Moped & light quadricycle', 18000, 20, 12, 16),
  ('A1', 'Light motorcycle', 22000, 20, 20, 16),
  ('A2', 'Medium motorcycle', 25000, 20, 20, 18),
  ('A', 'Motorcycle', 28000, 20, 20, 24),
  ('B', 'Passenger car', 33000, 20, 36, 18),
  ('BE', 'Car with trailer', 19000, 4, 6, 18),
  ('C1', 'Medium goods vehicle', 28500, 4, 16, 18),
  ('C1E', 'Medium goods combination', 22500, 4, 8, 18),
  ('C', 'Heavy goods vehicle', 38000, 4, 20, 21),
  ('CE', 'Heavy goods combination', 30000, 4, 8, 21),
  ('D1', 'Minibus', 34000, 4, 16, 21),
  ('D1E', 'Minibus with trailer', 26000, 4, 8, 21),
  ('D', 'Bus', 40000, 4, 20, 24),
  ('DE', 'Bus with trailer', 32000, 4, 8, 24),
  ('F', 'Tractor', 16000, 12, 12, 17),
  ('G', 'Mobile machinery', 16000, 12, 12, 16),
  ('T', 'Tram', 20000, 20, 20, 21)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "theoryLessons" = EXCLUDED."theoryLessons",
  "practicalLessons" = EXCLUDED."practicalLessons",
  "minimumAge" = EXCLUDED."minimumAge";
