import { expect, it } from "vitest";
import type { Wall } from "@/types/puter";
import { detectAllRooms } from "@/lib/room-detection";
import { buildPlanTopology } from "@/lib/plan-topology";

const wall = (
  id: string,
  x: number,
  y: number,
  x2: number,
  y2: number,
): Wall => ({
  id,
  start: { x, y },
  end: { x: x2, y: y2 },
  thickness: 6,
  height: 9,
  isLoadBearing: false,
});
const perimeter = [
  wall("top", 0, 0, 20, 0),
  wall("right", 20, 0, 20, 20),
  wall("bottom", 20, 20, 0, 20),
  wall("left", 0, 20, 0, 0),
];

it("finds adjacent rooms when a partition ends in the middle of unsplit perimeter walls", () => {
  const walls = [...perimeter, wall("partition", 10, 0, 10, 20)];
  const before = JSON.stringify(walls);
  const rooms = detectAllRooms(walls);
  expect(rooms.map((room) => room.area).sort()).toEqual([200, 200]);
  expect(JSON.stringify(walls)).toBe(before);
  expect(rooms.every((room) => room.wallIds?.includes("partition"))).toBe(true);
});
it("splits crossing partitions into four bounded faces regardless of source direction", () => {
  const walls = [
    ...perimeter,
    wall("vertical", 10, 0, 10, 20),
    wall("horizontal", 0, 10, 20, 10),
  ];
  expect(
    detectAllRooms(walls)
      .map((room) => room.area)
      .sort(),
  ).toEqual([100, 100, 100, 100]);
  const reversed = walls
    .map((item) => ({ ...item, start: item.end, end: item.start }))
    .reverse();
  expect(
    detectAllRooms(reversed)
      .map((room) => room.area)
      .sort(),
  ).toEqual([100, 100, 100, 100]);
});
it("does not count duplicate or overlapping segments as extra rooms", () => {
  const walls = [
    ...perimeter,
    wall("duplicate", 20, 0, 0, 0),
    wall("overlap", 5, 0, 15, 0),
  ];
  expect(detectAllRooms(walls).map((room) => room.area)).toEqual([400]);
  expect(
    buildPlanTopology(walls).edges.some(
      (edge) =>
        edge.wallIds.includes("overlap") && edge.wallIds.includes("top"),
    ),
  ).toBe(true);
});
it("does not close a real gap with an implicit six-inch snap", () => {
  const walls = [
    perimeter[0]!,
    perimeter[1]!,
    perimeter[2]!,
    wall("left", 0, 20, 0, 0.25),
  ];
  expect(detectAllRooms(walls)).toEqual([]);
});
it("keeps small closed closets and rejects zero-length or nonfinite input", () => {
  const walls = [
    wall("a", 0, 0, 2, 0),
    wall("b", 2, 0, 2, 2),
    wall("c", 2, 2, 0, 2),
    wall("d", 0, 2, 0, 0),
  ];
  expect(
    detectAllRooms([
      ...walls,
      wall("zero", 1, 1, 1, 1),
      wall("invalid", NaN, 0, 5, 0),
    ]).map((room) => room.area),
  ).toEqual([4]);
});
