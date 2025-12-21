<script>
	import { Header, PromptLibrary, PromptEditDrawer } from '$lib/components';

	let showEditDrawer = false;
	let editText = '';

	function handleEdit(e) {
		editText = e.detail.text;
		showEditDrawer = true;
	}

	function handleCloseEditDrawer() {
		showEditDrawer = false;
		editText = '';
	}

	function handleCopy(e) {
		// Optional: could show a toast notification
	}
</script>

<svelte:head>
	<title>Prompts | PromptFlam</title>
</svelte:head>

<Header />

<main class="prompts-page">
	<PromptLibrary 
		mode="page" 
		on:edit={handleEdit}
		on:copy={handleCopy}
	/>
</main>

<PromptEditDrawer 
	isOpen={showEditDrawer}
	text={editText}
	on:close={handleCloseEditDrawer}
/>

<style>
	.prompts-page {
		min-height: 100vh;
		padding: var(--spacing-md);
		padding-top: calc(var(--header-height) + var(--spacing-md) + var(--spacing-md));
		max-width: var(--max-content-width);
		margin: 0 auto;
	}
</style>
