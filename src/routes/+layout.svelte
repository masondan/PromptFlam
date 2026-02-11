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

<svelte:head>
	<!-- Primary Meta Tags -->
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="PromptFlam: A free mobile-first AI prompt library for content creators and journalists. Chat with Perplexity AI, manage templates, and save work locally." />
	<meta name="theme-color" content="#5422b0" />
	
	<!-- Favicon & App Icons -->
	<link rel="icon" type="image/x-icon" href="/logos/logo-promptflam-favicon.ico" />
	<link rel="apple-touch-icon" href="/logos/logo-promptflam-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://promptflam.pages.dev" />
	<meta property="og:title" content="PromptFlam - AI Prompt Library for Creators" />
	<meta property="og:description" content="A free mobile-first library of AI prompts for content creators and journalists. Chat with Perplexity AI, manage templates, and save work locally." />
	<meta property="og:image" content="https://promptflam.pages.dev/logos/logo-promptflam-og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="600" />
	<meta property="og:site_name" content="PromptFlam" />
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://promptflam.pages.dev" />
	<meta property="twitter:title" content="PromptFlam - AI Prompt Library for Creators" />
	<meta property="twitter:description" content="A free mobile-first library of AI prompts for content creators and journalists. Chat with Perplexity AI, manage templates, and save work locally." />
	<meta property="twitter:image" content="https://promptflam.pages.dev/logos/logo-promptflam-og.png" />
	
	<!-- Search Engine & Crawler Meta -->
	<meta name="robots" content="noindex, nofollow" />
	<meta name="googlebot" content="noindex, nofollow" />
	
	<!-- Additional Meta -->
	<meta name="author" content="PromptFlam" />
	<meta name="keywords" content="AI prompts, content creation, journalism, Perplexity AI, prompt library, writing tools" />
	<meta name="application-name" content="PromptFlam" />
	
	<title>PromptFlam - AI Prompt Library</title>
</svelte:head>

<div class="app-shell">
	<SwipeNavigation>
		<slot />
	</SwipeNavigation>
</div>
