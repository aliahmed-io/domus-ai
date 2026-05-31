import Graph from "graphology";
import { dijkstra } from "graphology-shortest-path";
import type { Vec3D, FloorPlanLayout } from "@/types/puter";
import { feetToMeters } from "./utils";

/**
 * Advanced MEP Pathfinding
 * Uses Dijkstra's algorithm to route pipes/wires along orthogonal wall axes
 * instead of cutting diagonally through rooms.
 */
export function calculateMepPath(
  startPos: Vec3D,
  endPos: Vec3D,
  layout: FloorPlanLayout
): Vec3D[] {
  const graph = new Graph();

  // 1. Create Nodes for the Start and End points
  graph.addNode("start", { x: startPos.x, y: startPos.z });
  graph.addNode("end", { x: endPos.x, y: endPos.z });

  // 2. Build a navigation grid from the walls
  // We'll add nodes at the intersections/corners of all walls
  const wallNodes: string[] = [];
  
  layout.walls.forEach((wall, idx) => {
    const idStart = `wall-${idx}-start`;
    const idEnd = `wall-${idx}-end`;
    
    // Convert wall coords from feet to meters to match MEP Vec3D
    const sx = feetToMeters(wall.start.x);
    const sy = feetToMeters(wall.start.y); // Floorplan Y is 3D Z
    const ex = feetToMeters(wall.end.x);
    const ey = feetToMeters(wall.end.y);

    if (!graph.hasNode(idStart)) {
      graph.addNode(idStart, { x: sx, y: sy });
      wallNodes.push(idStart);
    }
    if (!graph.hasNode(idEnd)) {
      graph.addNode(idEnd, { x: ex, y: ey });
      wallNodes.push(idEnd);
    }

    // Add edge along the wall
    const weight = Math.hypot(ex - sx, ey - sy);
    if (!graph.hasEdge(idStart, idEnd)) {
      graph.addUndirectedEdge(idStart, idEnd, { weight });
    }
  });

  // 3. Connect Start/End to the nearest wall nodes to inject them into the routing graph
  const connectToGraph = (nodeId: string, pos: Vec3D) => {
    let nearestDist = Infinity;
    let nearestNode = "";

    wallNodes.forEach((wn) => {
      const attrs = graph.getNodeAttributes(wn);
      const dist = Math.hypot(attrs.x - pos.x, attrs.y - pos.z);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNode = wn;
      }
    });

    if (nearestNode) {
      // Add a higher penalty weight for jumping from free-space to the wall grid
      graph.addUndirectedEdge(nodeId, nearestNode, { weight: nearestDist * 1.5 });
    }
  };

  connectToGraph("start", startPos);
  connectToGraph("end", endPos);

  // 4. Calculate Shortest Path
  const pathNodes = dijkstra.bidirectional(graph, "start", "end", "weight");

  // If no path found (disconnected graph), fallback to straight line
  if (!pathNodes || pathNodes.length === 0) {
    return [startPos, endPos];
  }

  // 5. Convert graph path back to 3D points
  const path3D: Vec3D[] = pathNodes.map((node) => {
    const attrs = graph.getNodeAttributes(node);
    return { x: attrs.x, y: 3.5, z: attrs.y }; // Default MEP height (e.g., ceiling drop)
  });

  // Ensure start and end match exactly at their original heights
  path3D[0] = startPos;
  path3D[path3D.length - 1] = endPos;

  return path3D;
}
