import { feetToMeters } from "./utils";

type Point = { x: number; y: number };
type Wall = {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
};

const getIntersection = (pA: Point, pB: Point, pC: Point, pD: Point): Point | null => {
  const a1 = pB.y - pA.y;
  const b1 = pA.x - pB.x;
  const c1 = a1 * pA.x + b1 * pA.y;

  const a2 = pD.y - pC.y;
  const b2 = pC.x - pD.x;
  const c2 = a2 * pC.x + b2 * pC.y;

  const determinant = a1 * b2 - a2 * b1;
  if (Math.abs(determinant) < 0.001) return null; // parallel

  const x = (b2 * c1 - b1 * c2) / determinant;
  const y = (a1 * c2 - a2 * c1) / determinant;
  return { x, y };
};

export const getWallPolygon = (wall: Wall, allWalls: Wall[]): number[] => {
  const sx = feetToMeters(wall.start.x);
  const sy = feetToMeters(wall.start.y);
  const ex = feetToMeters(wall.end.x);
  const ey = feetToMeters(wall.end.y);
  const t = feetToMeters(wall.thickness / 12) / 2;
  const angle = Math.atan2(ey - sy, ex - sx);
  const dx = Math.sin(angle) * t;
  const dy = Math.cos(angle) * t;

  let p1 = { x: sx + dx, y: sy - dy }; // start left
  let p2 = { x: ex + dx, y: ey - dy }; // end left
  let p3 = { x: ex - dx, y: ey + dy }; // end right
  let p4 = { x: sx - dx, y: sy + dy }; // start right

  // Find wall connecting at start
  const connectedAtStart = allWalls.filter(w => w.id !== wall.id && (
    (Math.abs(w.start.x - wall.start.x) < 0.03 && Math.abs(w.start.y - wall.start.y) < 0.03) ||
    (Math.abs(w.end.x - wall.start.x) < 0.03 && Math.abs(w.end.y - wall.start.y) < 0.03)
  ));
  
    if (connectedAtStart.length === 1) {
    const w = connectedAtStart[0]!;
    const wsx = feetToMeters(w.start.x);
    const wsy = feetToMeters(w.start.y);
    const wex = feetToMeters(w.end.x);
    const wey = feetToMeters(w.end.y);
    const wt = feetToMeters(w.thickness / 12) / 2;
    const wAngle = Math.atan2(wey - wsy, wex - wsx);
    const wdx = Math.sin(wAngle) * wt;
    const wdy = Math.cos(wAngle) * wt;
    
    const wp1 = { x: wsx + wdx, y: wsy - wdy };
    const wp2 = { x: wex + wdx, y: wey - wdy };
    const wp3 = { x: wex - wdx, y: wey + wdy };
    const wp4 = { x: wsx - wdx, y: wsy + wdy };

    const intLeftLeft = getIntersection(p1, p2, wp1, wp2);
    const intLeftRight = getIntersection(p1, p2, wp3, wp4);
    const intRightLeft = getIntersection(p3, p4, wp1, wp2);
    const intRightRight = getIntersection(p3, p4, wp3, wp4);
    
    const sPoint = { x: sx, y: sy };
    const distSq = (p: Point) => (p.x - sPoint.x)**2 + (p.y - sPoint.y)**2;
    
    const candidates1 = [intLeftLeft, intLeftRight].filter(Boolean) as Point[];
    if (candidates1.length > 0) {
      candidates1.sort((a,b) => distSq(a) - distSq(b));
      if (candidates1[0] && distSq(candidates1[0]) < (t * 4)**2) p1 = candidates1[0];
    }
    const candidates2 = [intRightLeft, intRightRight].filter(Boolean) as Point[];
    if (candidates2.length > 0) {
      candidates2.sort((a,b) => distSq(a) - distSq(b));
      if (candidates2[0] && distSq(candidates2[0]) < (t * 4)**2) p4 = candidates2[0];
    }
  }

  // Find wall connecting at end
  const connectedAtEnd = allWalls.filter(w => w.id !== wall.id && (
    (Math.abs(w.start.x - wall.end.x) < 0.03 && Math.abs(w.start.y - wall.end.y) < 0.03) ||
    (Math.abs(w.end.x - wall.end.x) < 0.03 && Math.abs(w.end.y - wall.end.y) < 0.03)
  ));
  
  if (connectedAtEnd.length === 1) {
    const w = connectedAtEnd[0]!;
    const wsx = feetToMeters(w.start.x);
    const wsy = feetToMeters(w.start.y);
    const wex = feetToMeters(w.end.x);
    const wey = feetToMeters(w.end.y);
    const wt = feetToMeters(w.thickness / 12) / 2;
    const wAngle = Math.atan2(wey - wsy, wex - wsx);
    const wdx = Math.sin(wAngle) * wt;
    const wdy = Math.cos(wAngle) * wt;
    
    const wp1 = { x: wsx + wdx, y: wsy - wdy };
    const wp2 = { x: wex + wdx, y: wey - wdy };
    const wp3 = { x: wex - wdx, y: wey + wdy };
    const wp4 = { x: wsx - wdx, y: wsy + wdy };

    const intLeftLeft = getIntersection(p1, p2, wp1, wp2);
    const intLeftRight = getIntersection(p1, p2, wp3, wp4);
    const intRightLeft = getIntersection(p3, p4, wp1, wp2);
    const intRightRight = getIntersection(p3, p4, wp3, wp4);
    
    const ePoint = { x: ex, y: ey };
    const distSq = (p: Point) => (p.x - ePoint.x)**2 + (p.y - ePoint.y)**2;
    
    const candidates1 = [intLeftLeft, intLeftRight].filter(Boolean) as Point[];
    if (candidates1.length > 0) {
      candidates1.sort((a,b) => distSq(a) - distSq(b));
      if (candidates1[0] && distSq(candidates1[0]) < (t * 4)**2) p2 = candidates1[0];
    }
    const candidates2 = [intRightLeft, intRightRight].filter(Boolean) as Point[];
    if (candidates2.length > 0) {
      candidates2.sort((a,b) => distSq(a) - distSq(b));
      if (candidates2[0] && distSq(candidates2[0]) < (t * 4)**2) p3 = candidates2[0];
    }
  }

  return [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];
};

/**
 * Calculates the exact area in square feet of a polygon defined by an array of [x,y, x,y, ...]
 * Uses the Surveyor's formula (Shoelace theorem).
 */
export const calculatePolygonArea = (flatPoints: number[]): number => {
  if (flatPoints.length < 6) return 0; // Needs at least 3 points
  let area = 0;
  for (let i = 0; i < flatPoints.length; i += 2) {
    const x1 = flatPoints[i]!;
    const y1 = flatPoints[i + 1]!;
    const x2 = flatPoints[(i + 2) % flatPoints.length]!;
    const y2 = flatPoints[(i + 3) % flatPoints.length]!;
    area += x1 * y2 - y1 * x2;
  }
  return Math.abs(area) / 2;
};
