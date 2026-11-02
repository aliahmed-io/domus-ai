import type { PuterProject } from "@/types/puter";

export default function SavedPlan({ project }: { project: PuterProject }) {
  const layout = project.floorPlanData;
  const walls = layout?.walls ?? [],
    rooms = layout?.rooms ?? [];
  const objects = project.sceneData?.objects ?? [];
  const points = [
    ...walls.flatMap((wall) => [wall.start, wall.end]),
    ...objects.map((item) => ({
      x: item.position.x / 0.3048,
      y: item.position.z / 0.3048,
    })),
  ];
  if (!points.length)
    return (
      <div className="gallery-empty">
        <p>
          This project has no saved geometry yet. Open a copy in the editor to
          start drawing.
        </p>
      </div>
    );
  const minX = Math.min(...points.map((p) => p.x)) - 3,
    minY = Math.min(...points.map((p) => p.y)) - 3;
  const width = Math.max(...points.map((p) => p.x)) - minX + 3,
    height = Math.max(...points.map((p) => p.y)) - minY + 3;
  return (
    <figure>
      <svg
        className="saved-plan-preview"
        viewBox={`${minX} ${minY} ${Math.max(width, 6)} ${Math.max(height, 6)}`}
        role="img"
        aria-label={`Saved floor plan for ${project.title}`}
      >
        {rooms.map((room) => (
          <g key={room.id}>
            <rect
              x={room.bounds.x}
              y={room.bounds.y}
              width={room.bounds.width}
              height={room.bounds.height}
              fill={room.color || "#e8eddf"}
              fillOpacity=".65"
            />
            <text
              x={room.bounds.x + room.bounds.width / 2}
              y={room.bounds.y + room.bounds.height / 2}
              textAnchor="middle"
              fontSize=".55"
              fill="#45536a"
            >
              {room.label}
            </text>
          </g>
        ))}
        {walls.map((wall) => (
          <line
            key={wall.id}
            x1={wall.start.x}
            y1={wall.start.y}
            x2={wall.end.x}
            y2={wall.end.y}
            stroke={wall.color || "currentColor"}
            strokeWidth={Math.max(wall.thickness / 12, 0.2)}
            strokeLinecap="square"
          />
        ))}
        {[...(layout?.doors ?? []), ...(layout?.windows ?? [])].map(
          (opening) => {
            const wall = walls.find((item) => item.id === opening.wallId);
            if (!wall) return null;
            const length = Math.hypot(
              wall.end.x - wall.start.x,
              wall.end.y - wall.start.y,
            );
            if (!length) return null;
            const half = opening.width / 24 / length,
              a = Math.max(0, opening.position - half),
              b = Math.min(1, opening.position + half);
            const x1 = wall.start.x + (wall.end.x - wall.start.x) * a,
              y1 = wall.start.y + (wall.end.y - wall.start.y) * a;
            const x2 = wall.start.x + (wall.end.x - wall.start.x) * b,
              y2 = wall.start.y + (wall.end.y - wall.start.y) * b;
            const door = layout?.doors.some((item) => item.id === opening.id);
            return (
              <g key={opening.id}>
                <path
                  d={`M${x1} ${y1}L${x2} ${y2}`}
                  stroke="white"
                  strokeWidth={wall.thickness / 12 + 0.1}
                />
                <path
                  d={`M${x1} ${y1}L${x2} ${y2}`}
                  stroke={door ? "#bc6539" : "#3157d5"}
                  strokeWidth=".13"
                >
                  <title>{door ? "Door" : "Window"}</title>
                </path>
              </g>
            );
          },
        )}
        {objects.map((item) => (
          <rect
            key={item.id}
            data-object-id={item.id}
            x={item.position.x / 0.3048 - 1}
            y={item.position.z / 0.3048 - 1}
            width="2"
            height="2"
            rx=".3"
            transform={`rotate(${(item.rotation.y * 180) / Math.PI} ${item.position.x / 0.3048} ${item.position.z / 0.3048})`}
            fill="#bda887"
            stroke="#716454"
            strokeWidth=".1"
          >
            <title>{item.name}</title>
          </rect>
        ))}
      </svg>
      <figcaption className="text-xs text-stone">
        Saved plan: room labels, wall colors, door and window markers, and
        approximate furniture positions.
      </figcaption>
    </figure>
  );
}
