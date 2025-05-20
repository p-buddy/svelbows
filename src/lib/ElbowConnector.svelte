<script lang="ts" module>
  import type { Box, Point } from "$lib/types.js";

  type Props = {
    path: Point[];
    width?: number;
    smoothing?: number;
    class?: string;
    zIndex?: number;
  };

  const boundingBorder = 1;

  const roundToBetweenPixels = (point: Point) => {
    return {
      x: Math.round(point.x * 2) / 2,
      y: Math.round(point.y * 2) / 2,
    };
  };
</script>

<script lang="ts">
  import { createSvgEndCaps, createSvgPath } from "./svg.js";

  let {
    path,
    smoothing = 0,
    width = 3,
    class: classList = "",
  }: Props = $props();

  export const update = (props: Props) => {
    path = props.path;
    if (props.smoothing !== undefined) smoothing = props.smoothing;
    if (props.width !== undefined) width = props.width;
  };

  const bounding = $derived.by(() => {
    let originX = Infinity,
      originY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const point of path) {
      if (point.x < originX) originX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < originY) originY = point.y;
      if (point.y > maxY) maxY = point.y;
    }

    const width = maxX - originX;
    const height = maxY - originY;

    return {
      x: Math.floor(originX - boundingBorder),
      y: Math.floor(originY - boundingBorder),
      width: Math.ceil(width + boundingBorder * 2),
      height: Math.ceil(height + boundingBorder * 2),
    };
  });

  const localCoordinates = $derived(
    path.map(({ x, y }) => ({
      x: x - bounding.x,
      y: y - bounding.y,
    })),
  );
</script>

<div
  class={classList}
  style:z-index="100"
  style:position="absolute"
  style:width={`${bounding.width}px`}
  style:height={`${bounding.height}px`}
  style:left={`${bounding.x}px`}
  style:top={`${bounding.y}px`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="100%"
    height="100%"
    viewBox={`0 0 ${bounding.width} ${bounding.height}`}
  >
    <path
      d={createSvgPath(localCoordinates.map(roundToBetweenPixels), smoothing)}
      stroke-linecap="butt"
      stroke-width={width}
      stroke="currentColor"
      vector-effect="non-scaling-stroke"
    />
    {#each createSvgEndCaps(localCoordinates, 10) as path}
      <path d={path} fill="currentColor" vector-effect="non-scaling-stroke" />
    {/each}
  </svg>
</div>
