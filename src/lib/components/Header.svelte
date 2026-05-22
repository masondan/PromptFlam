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
		{ name: 'archive', path: '/archive', label: 'Saved' },
		{ name: 'stylecheck', path: '/style-check', label: 'Style' }
	];

	function isActive(itemPath) {
		if (itemPath === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(itemPath);
	}
</script>

<!-- Mobile only: portal outside header so fixed drawer isn't clipped by header stacking context -->
<div class="flam-nav-mobile" class:header-hidden={headerHidden}>
	<flam-nav current="promptflam" class="mobile-nav"></flam-nav>
</div>

<header class="header" class:header-hidden={headerHidden}>
	<div class="header-top">
		<!-- Desktop only: flam-nav inside header (single row, no stacking context issue) -->
		<div class="flam-nav-desktop">
			<flam-nav current="promptflam"></flam-nav>
		</div>
		<!-- Mobile: placeholder to keep logo centred -->
		<div class="flam-nav-placeholder"></div>
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
	/*
	 * MOBILE: flam-nav rendered outside <header> so its fixed drawer isn't clipped
	 * by the header's stacking context (position:sticky + z-index creates one).
	 */
	.flam-nav-mobile {
		position: fixed;
		top: var(--spacing-md);
		left: var(--spacing-md);
		z-index: 200;
		display: flex;
		align-items: center;
		transition: transform 0.3s ease;
	}

	.flam-nav-mobile.header-hidden {
		transform: translateY(-200%);
	}

	/* Hide desktop version on mobile */
	.flam-nav-desktop {
		display: none;
	}

	/* Hide mobile placeholder on desktop */
	.flam-nav-placeholder {
		width: 22px;
		height: 22px;
		flex-shrink: 0;
	}

	@media (min-width: 680px) {
		/* Hide mobile portal on desktop */
		.flam-nav-mobile {
			display: none;
		}

		/* Show desktop version inside header */
		.flam-nav-desktop {
			display: flex;
			align-items: center;
		}

		/* Hide placeholder on desktop */
		.flam-nav-placeholder {
			display: none;
		}
	}

	.header {
		position: sticky;
		top: 0;
		background: var(--bg-main);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		z-index: 101;
		transition: transform 0.3s ease;
	}

	.header-hidden {
		transform: translateY(-100%);
	}

	@media (min-width: 680px) {
		.header {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: var(--spacing-md);
			height: calc(var(--header-height) + var(--spacing-md));
		}
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
		background: #e0e0e0;
		pointer-events: none;
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		width: 100%;
	}

	@media (min-width: 680px) {
		.header-top {
			gap: var(--spacing-sm);
			width: auto;
			justify-content: flex-start;
		}
	}

	.logo {
		height: 28px;
		width: auto;
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		width: 100%;
	}

	@media (min-width: 680px) {
		.nav {
			width: auto;
			flex-wrap: nowrap;
		}
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

	.nav-button.active :global(.icon svg) {
		filter: brightness(0) invert(1);
	}




</style>
