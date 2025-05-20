import type { Point } from "./types.js";

export function createSvgPath(points: Point[], radius = 0): string {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (radius <= 0) {
    // Default to sharp corners
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  const pathParts: string[] = [];

  pathParts.push(`M ${points[0].x} ${points[0].y}`);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Vectors
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;

    // Normalize vectors
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);
    const u1x = v1x / len1;
    const u1y = v1y / len1;
    const u2x = v2x / len2;
    const u2y = v2y / len2;

    // Adjust radius based on segment lengths
    // Use the minimum of the requested radius and half the shorter segment length
    const maxRadius = Math.min(len1, len2) / 2;
    const adjustedRadius = Math.min(radius, maxRadius);

    // Calculate entry and exit points for the rounded corner
    const startX = curr.x - u1x * adjustedRadius;
    const startY = curr.y - u1y * adjustedRadius;
    const endX = curr.x + u2x * adjustedRadius;
    const endY = curr.y + u2y * adjustedRadius;

    pathParts.push(`L ${startX} ${startY}`);
    pathParts.push(`Q ${curr.x} ${curr.y} ${endX} ${endY}`);
  }

  // Final segment
  const last = points[points.length - 1];
  pathParts.push(`L ${last.x} ${last.y}`);

  return pathParts.join(" ");
}

function createLargeEndCap(
  center: { x: number; y: number },
  direction: { x: number; y: number },
  capRadius: number,
  flip: boolean
): string {
  const angle = Math.atan2(direction.y, direction.x);
  const startAngle = angle + (flip ? Math.PI / 2 : -Math.PI / 2);
  const endAngle = angle + (flip ? -Math.PI / 2 : Math.PI / 2);

  const x0 = center.x + capRadius * Math.cos(startAngle);
  const y0 = center.y + capRadius * Math.sin(startAngle);
  const x1 = center.x + capRadius * Math.cos(endAngle);
  const y1 = center.y + capRadius * Math.sin(endAngle);

  return `M ${x0} ${y0} A ${capRadius} ${capRadius} 0 0 ${flip ? 0 : 1} ${x1} ${y1} Z`;
}

export const createSvgEndCaps = (points: Point[], width: number) => {
  const { length } = points;
  if (length === 0) return [];
  if (length === 1) return [];
  return [
    createLargeEndCap(
      points[0],
      {
        x: points[1].x - points[0].x,
        y: points[1].y - points[0].y,
      },
      width / 2,
      true,
    ),
    createLargeEndCap(
      points[points.length - 1],
      {
        x: points[length - 1].x - points[length - 2].x,
        y: points[length - 1].y - points[length - 2].y,
      },
      width / 2,
      false,
    ),
  ];
};
