<script>
	import { page } from '$app/stores';
	import { Icon } from '$lib/components';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher();

	let headerHidden = false;
	let lastScrollY = 0;
	const scrollThreshold = 10;

	function handleScroll() {
		const currentY = window.scrollY;
		if (Math.abs(currentY - lastScrollY) < scrollThreshold) return;

		headerHidden = currentY > lastScrollY && currentY > 60;
		lastScrollY = currentY;
	}

	onMount(() => {
		lastScrollY = window.scrollY;
		window.addEventListener('scroll', handleScroll, { passive: true });
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', handleScroll);
		}
	});

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

<header class="header" class:header-hidden={headerHidden}>
	<div class="header-left">
		<flam-nav current="promptflam"></flam-nav>
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
		position: sticky;
		top: 0;
		height: calc(var(--header-height) + var(--spacing-md));
		background: var(--bg-main);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-md) var(--spacing-md);
		z-index: 101;
		transition: transform 0.3s ease;
	}

	.header-hidden {
		transform: translateY(-100%);
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


	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.logo {
		height: 28px;
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
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background-color: #f0f0f0;
		color: #444;
		text-decoration: none;
		transition: background-color 0.15s, color 0.15s;
	}

	.nav-button:hover {
		background-color: #e4e4e4;
		color: #333;
		text-decoration: none;
	}

	.nav-button.active {
		background: var(--accent-brand);
		color: #ffffff;
	}




</style>
