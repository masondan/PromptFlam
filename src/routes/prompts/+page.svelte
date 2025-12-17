<script>
	import { Header } from '$lib/components';
</script>

<svelte:head>
	<title>Prompts | PromptFlam</title>
</svelte:head>

<Header />

<main class="page">
	<h1>Prompts</h1>
	<p>Prompt library will be built in Phase 4.</p>
	<p class="placeholder">This page will include:</p>
	<ul>
		<li>Category and subcategory filters</li>
		<li>Search functionality</li>
		<li>Favorites system</li>
		<li>Copy prompt functionality</li>
	</ul>
</main>

<style>
	.page {
		padding: var(--spacing-lg);
		padding-top: calc(var(--header-height) + var(--spacing-lg));
		max-width: 600px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: var(--spacing-md);
	}

	.placeholder {
		color: var(--color-text-muted);
		margin-top: var(--spacing-lg);
	}

	ul {
		color: var(--color-text-muted);
		padding-left: var(--spacing-lg);
		margin-top: var(--spacing-sm);
	}

	li {
		margin-bottom: var(--spacing-xs);
	}
</style>
