<script>
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { keepScreenAwake } from '../lib/wakeLock.js';
  import EmptyState from './EmptyState.svelte';

  /** @type {import('../lib/contentDiscovery.js').ContentItem[]} */
  export let items = [];

  export let debug = false;

  let currentIndex = 0;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @type {Set<string>} */
  let failedIds = new Set();

  /** @type {import('../lib/contentDiscovery.js').ContentItem[]} */
  let playableItems = [];

  /** @type {import('../lib/contentDiscovery.js').ContentItem | null} */
  let currentItem = null;

  let stopWakeLock = () => {};

  function next() {
    currentIndex = playableItems.length ? (currentIndex + 1) % playableItems.length : 0;
  }

  /**
   * @param {import('../lib/contentDiscovery.js').ContentItem | null} item
   */
  function schedule(item) {
    clearTimeout(timer);

    if (item) {
      timer = setTimeout(next, item.durationMs);
    }
  }

  /**
   * @param {import('../lib/contentDiscovery.js').ContentItem} item
   */
  function fail(item) {
    failedIds = new Set([...failedIds, item.id]);
    next();
  }

  $: playableItems = items.filter((item) => !failedIds.has(item.id));
  $: currentIndex = playableItems.length ? Math.min(currentIndex, playableItems.length - 1) : 0;
  $: currentItem = playableItems[currentIndex] ?? null;
  $: schedule(currentItem);

  onMount(() => {
    stopWakeLock = keepScreenAwake();
  });

  onDestroy(() => {
    clearTimeout(timer);
    stopWakeLock();
  });
</script>

{#if !currentItem}
  <EmptyState />
{:else}
  <main class="h-screen w-screen overflow-hidden bg-black text-white" aria-live="off">
    <section class="relative h-full w-full bg-black">
      {#key currentItem.id}
        <div
          class="absolute inset-0 grid place-items-center bg-black"
          in:fade={{ duration: 450 }}
          out:fade={{ duration: 450 }}
        >
          {#if currentItem.type === 'image'}
            <img
              class="block h-screen w-screen object-contain"
              src={currentItem.url}
              alt={currentItem.title}
              on:error={() => fail(currentItem)}
            />
          {:else if currentItem.type === 'html'}
            <iframe
              class="h-full w-full border-0 bg-white"
              title={currentItem.title}
              src={currentItem.url}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              on:error={() => fail(currentItem)}
            ></iframe>
          {/if}
        </div>
      {/key}

      <div
        class="absolute inset-x-0 bottom-4 flex justify-center gap-2 px-4"
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

      <div class="absolute inset-x-0 bottom-0 h-1 bg-white/10" aria-hidden="true">
        {#key currentItem.id}
          <div
            class="h-full origin-left bg-white/80"
            style={`animation: progress ${currentItem.durationMs}ms linear forwards;`}
          ></div>
        {/key}
      </div>

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
