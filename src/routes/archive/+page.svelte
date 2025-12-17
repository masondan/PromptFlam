<script>
	import { Header } from '$lib/components';
</script>

<svelte:head>
	<title>Saved | PromptFlam</title>
</svelte:head>

<Header />

<main class="page">
	<h1>Saved</h1>
	<p>Archive functionality will be built in Phase 5.</p>
	<p class="placeholder">This page will include:</p>
	<ul>
		<li>Two-tab interface: Chats | Edits</li>
		<li>Saved chat sessions with previews</li>
		<li>Saved text drafts</li>
		<li>Three-dot menu: Download | Share | Delete</li>
		<li>Auto-cleanup (30 days, max 10 items per tab)</li>
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
