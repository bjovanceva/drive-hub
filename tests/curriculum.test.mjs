import assert from "node:assert/strict";
import test from "node:test";

import { buildCurricula } from "../prisma/curriculum.mjs";

const categories = [
  { code: "AM", theoryLessons: 20, practicalLessons: 12 },
  { code: "A1", theoryLessons: 20, practicalLessons: 20 },
  { code: "A2", theoryLessons: 20, practicalLessons: 20 },
  { code: "A", theoryLessons: 20, practicalLessons: 20 },
  { code: "B", theoryLessons: 20, practicalLessons: 36 },
  { code: "BE", theoryLessons: 4, practicalLessons: 6 },
  { code: "C1", theoryLessons: 4, practicalLessons: 16 },
  { code: "C1E", theoryLessons: 4, practicalLessons: 8 },
  { code: "C", theoryLessons: 4, practicalLessons: 20 },
  { code: "CE", theoryLessons: 4, practicalLessons: 8 },
  { code: "D1", theoryLessons: 4, practicalLessons: 16 },
  { code: "D1E", theoryLessons: 4, practicalLessons: 8 },
  { code: "D", theoryLessons: 4, practicalLessons: 20 },
  { code: "DE", theoryLessons: 4, practicalLessons: 8 },
  { code: "F", theoryLessons: 12, practicalLessons: 12 },
  { code: "G", theoryLessons: 12, practicalLessons: 12 },
  { code: "T", theoryLessons: 20, practicalLessons: 20 },
];

test("defines a complete, ordered curriculum for every category", () => {
  const rows = buildCurricula(categories);

  assert.equal(rows.length, 442);

  for (const category of categories) {
    const categoryRows = rows.filter(
      (row) => row.categoryCode === category.code,
    );
    const theory = categoryRows.filter((row) => row.type === "THEORY");
    const practical = categoryRows.filter((row) => row.type === "PRACTICAL");

    assert.equal(
      theory.length,
      category.theoryLessons,
      `${category.code} theory count`,
    );
    assert.equal(
      practical.length,
      category.practicalLessons,
      `${category.code} practical count`,
    );
    assert.deepEqual(
      categoryRows.map((row) => row.sequence),
      Array.from({ length: categoryRows.length }, (_, index) => index + 1),
      `${category.code} sequences`,
    );
    assert.equal(
      new Set(categoryRows.map((row) => row.title)).size,
      categoryRows.length,
    );
    assert.ok(categoryRows.every((row) => row.durationMinutes === 45));
    assert.ok(
      categoryRows.every((row) => row.title && row.concept && row.goal),
    );
  }
});

test("category B includes the official proving-ground skill groups", () => {
  const categoryBLessons = buildCurricula(categories).filter(
    (row) => row.categoryCode === "B" && row.type === "PRACTICAL",
  );

  for (const topic of [
    "reversing",
    "turning",
    "parking",
    "uphill start",
    "precision",
  ]) {
    assert.ok(
      categoryBLessons.some((row) =>
        `${row.title} ${row.concept}`.toLowerCase().includes(topic),
      ),
      `missing ${topic}`,
    );
  }
});

test("fails before writing if a configured lesson count drifts", () => {
  assert.throws(
    () =>
      buildCurricula(
        categories.map((category) =>
          category.code === "B"
            ? { ...category, practicalLessons: 35 }
            : category,
        ),
      ),
    /Category B requires 35 practical lessons, defined 36/,
  );
});
