import { expect, it } from "vitest";
import { csvRow } from "@/lib/export/csv";

it("preserves commas, quotes and line breaks without enabling formulas", () => {
  expect(csvRow(["Oak, white", 'A "chair"', "Line\nbreak", "=1+1", -2])).toBe(
    '"Oak, white","A ""chair""","Line\nbreak","\'=1+1","-2"',
  );
});
