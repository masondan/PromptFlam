<script>
	import { page } from '$app/stores';
	import { Icon } from '$lib/components';
	import { createEventDispatcher } from 'svelte';



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
	<div class="logo-container">
		<img src="/logos/logo-promptflam.png" alt="PromptFlam" class="logo" />
	</div>

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

</header>

<style>
	.header {
		position: relative;
		height: calc(var(--header-height) + var(--spacing-md));
		background: var(--bg-main);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-md) var(--spacing-md);
		z-index: 101;
	}

	@media (min-width: 768px) {
		.header {
			max-width: var(--app-max-width);
			margin: 0 auto;
		}
	}

	/* Separator under header */
	.header::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: #999999;
		pointer-events: none;
	}


	.logo-container {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.logo {
		height: 38px;
		width: auto;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1px solid var(--color-icon-default);
		color: var(--color-icon-default);
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
		box-shadow: none;
	}

	.nav-button:hover {
		border-color: var(--color-icon-active);
		color: var(--color-icon-active);
		text-decoration: none;
		box-shadow: 0 0 0 1px var(--color-icon-active);
	}

	.nav-button.active {
		border: none;
		background: var(--accent-brand);
		color: #ffffff;
	}




</style>
