<script>
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { keepScreenAwake } from '../lib/wakeLock.js';
  import EmptyState from './EmptyState.svelte';

  /** @type {import('../lib/contentDiscovery.js').ContentItem[]} */
  export let items = [];

  export let debug = false;

  let currentIndex = 0;
  let cycle = 0;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @type {Set<string>} */
  let failedIds = new Set();

  /** @type {import('../lib/contentDiscovery.js').ContentItem[]} */
  let playableItems = [];

  /** @type {import('../lib/contentDiscovery.js').ContentItem | null} */
  let currentItem = null;

  let isFullscreen = false;
  let stopWakeLock = () => {};

  function next() {
    currentIndex = playableItems.length ? (currentIndex + 1) % playableItems.length : 0;
    cycle += 1;
  }

  /**
   * @param {import('../lib/contentDiscovery.js').ContentItem | null} item
   * @param {number} scheduledCycle
   */
  function schedule(item, scheduledCycle) {
    clearTimeout(timer);
    if (item) {
      timer = setTimeout(() => {
        if (cycle === scheduledCycle) next();
      }, item.durationMs);
    }
  }

  /**
   * @param {import('../lib/contentDiscovery.js').ContentItem} item
   */
  function fail(item) {
    failedIds = new Set([...failedIds, item.id]);
    next();
  }

  function restartWakeLock() {
    stopWakeLock();
    stopWakeLock = keepScreenAwake();
  }

  async function enterFullscreen() {
    restartWakeLock();

    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen can be denied by browser policy; wake lock still keeps trying when supported.
      }
    }
  }

  function updateFullscreenState() {
    isFullscreen = Boolean(document.fullscreenElement);
  }

  $: playableItems = items.filter((item) => !failedIds.has(item.id));
  $: currentIndex = playableItems.length ? Math.min(currentIndex, playableItems.length - 1) : 0;
  $: currentItem = playableItems[currentIndex] ?? null;
  $: schedule(currentItem, cycle);

  onMount(() => {
    restartWakeLock();
    updateFullscreenState();
    document.addEventListener('fullscreenchange', updateFullscreenState);
  });

  onDestroy(() => {
    clearTimeout(timer);
    document.removeEventListener('fullscreenchange', updateFullscreenState);
    stopWakeLock();
  });
</script>

{#if !currentItem}
  <EmptyState />
{:else}
  <main class="h-screen w-screen overflow-hidden bg-black text-white" aria-live="off">
    <section class="relative h-full w-full bg-black">
      {#key currentItem.id}
        <div class="absolute inset-0 grid place-items-center bg-black" in:fade={{ duration: 180 }}>
          {#if currentItem.type === 'image'}
            <img
              class="block h-screen w-screen object-contain"
              src={currentItem.url}
              alt={currentItem.title}
              on:error={() => fail(currentItem)}
            />
          {:else if currentItem.type === 'html'}
            <iframe
              class="h-full w-full border-0 bg-black"
              title={currentItem.title}
              src={currentItem.url}
              allow="autoplay; fullscreen; picture-in-picture; screen-wake-lock"
              allowfullscreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              on:error={() => fail(currentItem)}
            ></iframe>
          {/if}
        </div>
      {/key}

      <div
        class="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 px-4"
        aria-label={`Slide ${currentIndex + 1} of ${playableItems.length}`}
      >
        {#each playableItems as item, index (item.id)}
          <span
            class={`h-2.5 w-2.5 rounded-full shadow-lg ring-1 ring-white/40 transition-all duration-300 ${
              index === currentIndex ? 'scale-125 bg-white' : 'bg-white/35'
            }`}
            aria-current={index === currentIndex ? 'true' : undefined}
          ></span>
        {/each}
      </div>

      <div class="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/10" aria-hidden="true">
        {#key `${currentItem.id}:${cycle}`}
          <div
            class="h-full origin-left bg-white/80"
            style={`animation: progress ${currentItem.durationMs}ms linear forwards;`}
          ></div>
        {/key}
      </div>

      {#if !isFullscreen}
        <button
          class="absolute right-4 top-4 z-20 cursor-auto rounded-full bg-white/90 px-5 py-3 text-sm font-bold uppercase tracking-wide text-black shadow-2xl ring-1 ring-black/10 transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-sky-400"
          type="button"
          on:click={enterFullscreen}
        >
          Fullscreen
        </button>
      {/if}

      {#if debug}
        <aside
          class="absolute bottom-4 left-4 max-w-[calc(100vw-2rem)] rounded-xl bg-black/75 px-4 py-3 font-mono text-xs text-white shadow-2xl ring-1 ring-white/15"
          aria-label="debug carousel status"
        >
          <p class="font-bold uppercase tracking-wide text-sky-300">Debug mode</p>
          <p>{currentIndex + 1} / {playableItems.length}</p>
          <p class="truncate">{currentItem.title}</p>
          <p class="text-white/70">{currentItem.type} · {currentItem.durationMs}ms</p>
        </aside>
      {/if}
    </section>
  </main>
{/if}
