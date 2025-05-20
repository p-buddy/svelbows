<script lang="ts" module>
  class SeededRandom {
    private m: number;
    private a: number;
    private c: number;
    private state: number;

    constructor(seed: number) {
      // LCG using GCC's constants
      this.m = 0x80000000; // 2**31;
      this.a = 1103515245;
      this.c = 12345;
      this.state = seed;
    }

    nextInt(): number {
      this.state = (this.a * this.state + this.c) % this.m;
      return this.state;
    }

    nextFloat(): number {
      // returns in range [0,1]
      return this.nextInt() / (this.m - 1);
    }

    nextRange(start: number, end: number): number {
      const rangeSize = end - start;
      const randomUnder1 = this.nextInt() / this.m;
      return start + Math.floor(randomUnder1 * rangeSize);
    }

    choice<T>(array: T[]): T {
      return array[this.nextRange(0, array.length)];
    }
  }

  class Value<T> {
    value = $state<T>(null as unknown as T);

    constructor(initial: T) {
      this.value = initial;
    }
  }

  const countDefault = 50;
  const countMax = 100;
</script>

<script lang="ts">
  import { createElbowConnector } from "$lib/elbow-connector.js";
  import ElbowConnector from "$lib/ElbowConnector.svelte";
  import { getElbowConnectorBetween } from "$lib/index.js";
  import type { Box } from "$lib/types.js";
  import { defaults } from "$lib/utils.js";
  import { mount } from "svelte";

  const seed = new Value(0);
  const count = new Value(countDefault);
  const yMin = new Value(0);
  const yMax = new Value(20);
  const xMin = new Value(0);
  const xMax = new Value(50);
  const widthMin = new Value(10);
  const widthMax = new Value(200);
  const heightMin = new Value(10);
  const heightMax = new Value(100);
  const start = new Value(0);
  const end = new Value(Math.floor(countDefault / 2));
  const smoothing = new Value(0);

  const sides = ["top", "right", "bottom", "left"] as const;
  const startSide = new Value<(typeof sides)[number]>("right");
  const endSide = new Value<(typeof sides)[number]>("left");

  const parameters = {
    seed,
    count,
    yMin,
    yMax,
    xMin,
    xMax,
    widthMin,
    widthMax,
    heightMin,
    start,
    end,
  };

  const readout = $derived.by(() => {
    let readout = "";
    for (const [key, value] of Object.entries(parameters))
      readout += `(${key}: ${value.value}) `;
    return readout;
  });

  type Config = {
    margin: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    width: number;
    height: number;
    color: string;
  };

  let elements = $state(
    new Array<HTMLDivElement>(countMax).fill(null as unknown as HTMLDivElement),
  );

  const configs: Config[] = $derived.by(() => {
    const random = new SeededRandom(seed.value);
    const configs = new Array<Config>(count.value);
    const _r = yMin.value / yMax.value;
    const _g = widthMin.value / widthMax.value;
    const _b = heightMin.value / heightMax.value;

    for (let i = 0; i < count.value; i++) {
      const width = random.nextRange(widthMin.value, widthMax.value);
      const height = random.nextRange(heightMin.value, heightMax.value);
      const r = _r * (width + height) * 8;
      const g = _g * width * 8;
      const b = _b * height * 8;
      configs[i] = {
        margin: {
          top: random.nextRange(yMin.value, yMax.value),
          right: random.nextRange(xMin.value, xMax.value),
          bottom: random.nextRange(yMin.value, yMax.value),
          left: random.nextRange(xMin.value, xMax.value),
        },
        width,
        height,
        color: `rgb(${r}, ${g}, ${b})`,
      };
    }
    return configs;
  });

  let container: HTMLDivElement;

  const startEl = $derived(elements[start.value]);
  const endEl = $derived(elements[end.value]);

  const startRect = $derived(startEl?.getBoundingClientRect() ?? defaults.box);
  const endRect = $derived(endEl?.getBoundingClientRect() ?? defaults.box);

  const boundingBox = (id: string, rect: Box) => {
    const element =
      (document.getElementById(id) as HTMLDivElement) ??
      document.body.appendChild(document.createElement("div"));
    element.id = id;
    element.style.position = "absolute";
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.top = `${rect.y}px`;
    element.style.left = `${rect.x}px`;
    element.style.outline = "4px solid red";
  };

  $effect(() => {
    // boundingBox("start-outline", startRect);
    // boundingBox("end-outline", endRect);
  });

  let elbowConnector: ElbowConnector;

  $effect(() => {
    console.time("getElbowConnectorBetween");
    const path = getElbowConnectorBetween(
      { rect: startRect, edge: { side: startSide.value, location: 0.5 } },
      { rect: endRect, edge: { side: endSide.value, location: 0.5 } },
    );
    console.timeEnd("getElbowConnectorBetween");
    if (elbowConnector)
      elbowConnector.update({ path, smoothing: smoothing.value });
    else {
      elbowConnector = mount(ElbowConnector, {
        target: document.body,
        props: {
          path,
          smoothing: smoothing.value,
        },
      });
    }
  });
</script>

{#snippet range(
  object: Record<string, Value<number>>,
  min: number,
  max: number,
  step: number = 1,
)}
  {#each Object.entries(object) as [key, value]}
    <div class="flex flex-row">
      <label for={key} class="text-s">{key}</label>
      <input
        id={key}
        type="range"
        bind:value={value.value}
        {min}
        {max}
        {step}
      />
    </div>
  {/each}
{/snippet}

{#snippet select<T>(
  object: Record<string, Value<T>>,
  options: T[] | readonly T[],
)}
  {#each Object.entries(object) as [key, value]}
    <div class="flex flex-row">
      <label for={key} class="text-s">{key}</label>
      <select id={key} bind:value={value.value}>
        {#each options as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </div>
  {/each}
{/snippet}

<div class="relative" bind:this={container}>
  <div class="flex flex-col h-screen w-screen">
    <div class="flex flex-row flex-wrap">
      {@render range({ seed }, 0, 100)}
      {@render range({ count }, 1, countMax)}
      {@render range({ yMin }, 0, yMax.value - 1)}
      {@render range({ yMax }, yMin.value + 1, 50)}
      {@render range({ xMin }, 0, xMax.value - 1)}
      {@render range({ xMax }, xMin.value + 1, 50)}
      {@render range({ widthMin }, 0, widthMax.value - 10)}
      {@render range({ widthMax }, widthMin.value + 10, 200)}
      {@render range({ heightMin }, 0, heightMax.value - 10)}
      {@render range({ heightMax }, heightMin.value + 10, 100)}
      {@render range({ start }, 0, end.value - 1)}
      {@render range({ end }, start.value + 1, count.value - 1)}
      {@render range({ smoothing }, 0, 10)}
      {@render select({ startSide }, sides)}
      {@render select({ endSide }, sides)}
    </div>
    <div>
      {readout}
    </div>
    <div
      class="flex-grow flex overflow-hidden flex-wrap items-center justify-center"
    >
      {#each configs as config, index}
        <div
          bind:this={elements[index]}
          style:margin-top={`${config.margin.top}px`}
          style:margin-right={`${config.margin.right}px`}
          style:margin-bottom={`${config.margin.bottom}px`}
          style:margin-left={`${config.margin.left}px`}
          style:width={`${config.width}px`}
          style:height={`${config.height}px`}
          style:background-color={config.color}
        ></div>
      {/each}
    </div>
  </div>
</div>
