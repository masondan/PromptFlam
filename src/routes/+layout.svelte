<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { cleanupOldArchives } from '$lib/stores';
	import { SwipeNavigation } from '$lib/components';

	onMount(() => {
		cleanupOldArchives();
	});
</script>

<div class="app-shell">
	<SwipeNavigation>
		<slot />
	</SwipeNavigation>
</div>
