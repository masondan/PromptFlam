<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { cleanupOldArchives, clearSessionStores, autoSaveChat, autoSaveNote } from '$lib/stores';
	import { SwipeNavigation } from '$lib/components';

	onMount(() => {
		cleanupOldArchives();
		
		// Fresh start logic: clear session stores on new app launch
		// sessionStorage persists across refresh/back-nav but clears on tab/browser close
		if (!sessionStorage.getItem('promptflam_session_active')) {
			clearSessionStores();
		}
		sessionStorage.setItem('promptflam_session_active', 'true');
		
		// Save any unsaved work before leaving (handles accidental close)
		const handleBeforeUnload = () => {
			autoSaveChat();
			autoSaveNote();
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);
		
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});
</script>

<div class="app-shell">
	<SwipeNavigation>
		<slot />
	</SwipeNavigation>
</div>
