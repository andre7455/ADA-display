<script>
  import SignagePlayer from './components/SignagePlayer.svelte';
  import { getConfiguredDuration, getDebugMode } from './lib/config.js';
  import { discoverContent } from './lib/contentDiscovery.js';

  const search = globalThis.location?.search ?? '';
  const displayDurationMs = getConfiguredDuration(search);
  const debug = getDebugMode(search);
  const items = discoverContent({ durationMs: displayDurationMs });
</script>

<SignagePlayer {items} {debug} />
