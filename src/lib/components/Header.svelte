<script>
	import { page } from '$app/stores';
	import { Icon } from '$lib/components';
	import { createEventDispatcher } from 'svelte';

	export let showNewNote = false;
	export let onNewNote = () => {};

	const dispatch = createEventDispatcher();

	$: isPromptsPage = $page.url.pathname === '/';

	function handleProfileClick() {
		dispatch('openPersonaSettings');
	}

	const navItems = [
		{ name: 'prompts', path: '/', label: 'Prompts' },
		{ name: 'create', path: '/create', label: 'Create' },
		{ name: 'notepad', path: '/notepad', label: 'Notepad' },
		{ name: 'archive', path: '/archive', label: 'Saved' }
	];

	function isActive(itemPath) {
		if (itemPath === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(itemPath);
	}
</script>

<header class="header">
	<nav class="nav" aria-label="Main navigation">
		{#each navItems as item}
			<a
				href={item.path}
				class="nav-button"
				class:active={isActive(item.path)}
				aria-label={item.label}
				aria-current={isActive(item.path) ? 'page' : undefined}
			>
				<Icon name={item.name} size={20} />
			</a>
		{/each}
	</nav>
	
	{#if showNewNote}
		<button
			class="new-chat-button"
			on:click={onNewNote}
			aria-label="Start new note"
		>
			<Icon name="newchat" size={20} />
		</button>
	{/if}

</header>

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: calc(var(--header-height) + var(--spacing-md));
		background: var(--bg-main);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
		z-index: 101;
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
	}

	@media (min-width: 768px) {
		.header {
			left: 50%;
			right: auto;
			transform: translateX(-50%) translateZ(0);
			width: 100%;
			max-width: var(--app-max-width);
			-webkit-transform: translateX(-50%) translateZ(0);
		}
	}

	/* Gradient fade at bottom of header */
	.header::after {
		content: '';
		position: absolute;
		bottom: -16px;
		left: 0;
		right: 0;
		height: 16px;
		background: linear-gradient(to bottom, var(--bg-main), transparent);
		pointer-events: none;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1px solid var(--color-icon-default);
		color: var(--color-icon-default);
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}

	.nav-button:hover {
		border: 2px solid var(--color-icon-active);
		color: var(--color-icon-active);
		text-decoration: none;
	}

	.nav-button.active {
		border: none;
		background: var(--accent-brand);
		color: #ffffff;
	}




</style>
