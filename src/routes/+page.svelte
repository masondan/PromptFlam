<script>
	import { Header, PromptLibrary, PromptEditDrawer, PersonaSettingsDrawer } from '$lib/components';

	let showEditDrawer = false;
	let editText = '';
	let showPersonaDrawer = false;
	let personaVersion = 0;

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

	function handlePersonaSaved() {
		personaVersion += 1;
	}
</script>

<svelte:head>
	<title>Prompts | PromptFlam</title>
</svelte:head>

<Header on:openPersonaSettings={() => showPersonaDrawer = true} />

<main class="prompts-page">
	{#key personaVersion}
		<PromptLibrary 
			mode="page" 
			on:edit={handleEdit}
			on:copy={handleCopy}
			onProfileClick={() => showPersonaDrawer = true}
		/>
	{/key}
</main>

<PromptEditDrawer 
	isOpen={showEditDrawer}
	text={editText}
	on:close={handleCloseEditDrawer}
/>

<PersonaSettingsDrawer 
	isOpen={showPersonaDrawer}
	on:close={() => showPersonaDrawer = false}
	on:saved={handlePersonaSaved}
/>

<style>
	.prompts-page {
		min-height: 100vh;
		padding: var(--spacing-md);
		padding-top: var(--spacing-xl);
		max-width: var(--max-content-width);
		margin: 0 auto;
	}
</style>
