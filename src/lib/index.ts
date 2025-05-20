// Reexport your entry components here

import { createElbowConnector } from "./elbow-connector.js";
import type { Point } from "./types.js";

type Rect = Pick<DOMRect, "x" | "y" | "width" | "height">;
type Edge = { side: "top" | "right" | "bottom" | "left", location: number };

const getEdgePoint = (rect: Rect, edge: Edge): Point => {
  const { x, y, width, height } = rect;
  const { side, location } = edge;

  switch (side) {
    case "top":
      return { x: x + width * location, y: y };
    case "right":
      return { x: x + width, y: y + height * location };
    case "bottom":
      return { x: x + width * location, y: y + height };
    case "left":
      return { x: x, y: y + height * location };
  }
};

type Anchor = {
  rect: Rect;
  edge: Edge;
}

const nudgePointsTowardsAnchor = (
  { edge: { side }, rect }: Anchor,
  closerToAnchor: Point,
  furtherFromAnchor: Point,
) => {
  const slope = Math.round(
    Math.abs(closerToAnchor.y - furtherFromAnchor.y) /
    Math.abs(closerToAnchor.x - furtherFromAnchor.x)
  );
  const isHorizontal = slope === 0;
  switch (side) {
    case "top":
    case "bottom":
      const targetY = side === "top" ? rect.y : rect.y + rect.height;
      closerToAnchor.y = targetY;
      if (isHorizontal) furtherFromAnchor.y = targetY;
      break;
    case "right":
    case "left":
      const targetX = side === "right" ? rect.x + rect.width : rect.x;
      closerToAnchor.x = targetX;
      if (!isHorizontal) furtherFromAnchor.x = targetX;
      break;
  }
}



export const getElbowConnectorBetween = (
  start: Anchor,
  end: Anchor,
) => {
  const startPoint = getEdgePoint(start.rect, start.edge);
  const endPoint = getEdgePoint(end.rect, end.edge);
  const points = createElbowConnector(startPoint, endPoint, start.rect, end.rect, 5);
  // if edge of point is in direction of edge, nudge both points towards the edge. 
  const { length } = points;
  if (length >= 2) {
    nudgePointsTowardsAnchor(start, points[0], points[1]);
    nudgePointsTowardsAnchor(end, points[length - 1], points[length - 2]);
  }
  return points;
};
