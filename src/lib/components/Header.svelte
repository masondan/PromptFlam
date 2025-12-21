<script>
	import { page } from '$app/stores';
	import { Icon } from '$lib/components';

	export let showNewChat = false;
	export let onNewChat = () => {};
	export let showNewNote = false;
	export let onNewNote = () => {};

	const navItems = [
		{ name: 'prompts', path: '/prompts', label: 'Prompts' },
		{ name: 'create', path: '/', label: 'Create' },
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
	
	{#if showNewChat}
		<button
			class="new-chat-button"
			on:click={onNewChat}
			aria-label="Start new chat"
		>
			<Icon name="newchat" size={20} />
		</button>
	{/if}
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
		height: calc(var(--header-height) + var(--spacing-sm));
		background: var(--bg-main);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-md);
		z-index: var(--z-header);
	}

	@media (min-width: 768px) {
		.header {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			width: 100%;
			max-width: var(--app-max-width);
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

	.new-chat-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: none;
		background: var(--accent-brand);
		color: #ffffff;
		transition: background-color 0.15s;
	}

	.new-chat-button:hover {
		background: #4a1e9e;
	}
</style>
