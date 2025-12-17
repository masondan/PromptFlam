<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { cleanupOldArchives } from '$lib/stores';

	onMount(() => {
		cleanupOldArchives();
	});
</script>

<slot />
