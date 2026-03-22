<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	let content = '';
	let loading = true;

	onMount(async () => {
		try {
			const response = await fetch('/style-guide.md');
			content = await response.text();
		} catch (error) {
			console.error('Error loading style guide:', error);
			content = 'Error loading style guide.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Editorial Style Guide | PromptFlam</title>
</svelte:head>

<div class="style-guide-page">
	<Header />
	<main class="guide-content">
		{#if loading}
			<div class="loading">Loading style guide...</div>
		{:else}
			<div class="guide-wrapper">
				<pre class="guide-text">{content}</pre>
			</div>
		{/if}
	</main>
</div>

<style>
	.style-guide-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--bg-main);
	}

	main {
		flex: 1;
		padding: var(--spacing-lg);
		overflow-y: auto;
	}

	.loading {
		text-align: center;
		padding: var(--spacing-xl);
		color: var(--text-secondary);
	}

	.guide-wrapper {
		max-width: 900px;
		margin: 0 auto;
		width: 100%;
	}

	.guide-text {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: inherit;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text-primary);
		background: none;
		padding: 0;
		margin: 0;
	}

	@media (max-width: 640px) {
		main {
			padding: var(--spacing-md);
		}

		.guide-text {
			font-size: 0.9rem;
		}
	}
</style>
