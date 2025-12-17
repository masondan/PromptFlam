<script>
	import { Header } from '$lib/components';
</script>

<svelte:head>
	<title>Edit | PromptFlam</title>
</svelte:head>

<Header />

<main class="page">
	<h1>Edit</h1>
	<p>Text editor will be built in Phase 6.</p>
	<p class="placeholder">This page will include:</p>
	<ul>
		<li>Rich text editor</li>
		<li>Text formatting toolbar (Bold, Italic, Underline)</li>
		<li>Save draft functionality</li>
		<li>Download as .txt</li>
		<li>Copy to clipboard</li>
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
