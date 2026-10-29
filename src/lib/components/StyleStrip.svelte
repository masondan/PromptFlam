<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { Icon } from '$lib/components';

	export let styles = [];
	export let selected = null; // null represents 'None'

	const dispatch = createEventDispatcher();

	let scrollContainer;
	let canScrollLeft = false;
	let canScrollRight = false;
	let imgErrors = {};

	function updateScrollButtons() {
		if (!scrollContainer) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
		canScrollLeft = scrollLeft > 4;
		canScrollRight = scrollLeft < scrollWidth - clientWidth - 4;
	}

	function scroll(direction) {
		if (!scrollContainer) return;
		const amount = direction === 'left' ? -200 : 200;
		scrollContainer.scrollBy({ left: amount, behavior: 'smooth' });
	}

	function selectStyle(id) {
		if (selected === id) {
			selected = null;
		} else {
			selected = id;
		}
		dispatch('select', { styleId: selected });
	}

	onMount(() => {
		updateScrollButtons();
		const resizeObserver = new ResizeObserver(() => {
			updateScrollButtons();
		});
		if (scrollContainer) {
			resizeObserver.observe(scrollContainer);
		}
		return () => {
			resizeObserver.disconnect();
		};
	});

	$: if (styles) {
		setTimeout(updateScrollButtons, 50);
	}
</script>

<div class="style-strip-container">
	{#if canScrollLeft}
		<button
			type="button"
			class="nav-chevron left"
			on:click={() => scroll('left')}
			aria-label="Scroll styles left"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>
	{/if}

	<div
		class="style-strip"
		bind:this={scrollContainer}
		on:scroll={updateScrollButtons}
		role="radiogroup"
		aria-label="Image style"
	>
		<!-- None tile -->
		<button
			type="button"
			role="radio"
			aria-checked={selected === null}
			class="style-item"
			class:selected={selected === null}
			on:click={() => selectStyle(null)}
		>
			<div class="tile none-tile">
				<Icon name="ai" size={28} />
			</div>
			<span class="style-label">None</span>
		</button>

		<!-- Style tiles -->
		{#each styles as style (style.id)}
			<button
				type="button"
				role="radio"
				aria-checked={selected === style.id}
				class="style-item"
				class:selected={selected === style.id}
				on:click={() => selectStyle(style.id)}
			>
				<div class="tile image-tile">
					{#if !imgErrors[style.id]}
						<img
							src={style.thumb}
							alt=""
							width="72"
							height="72"
							loading="lazy"
							decoding="async"
							on:error={() => (imgErrors[style.id] = true)}
						/>
					{:else}
						<div class="placeholder-tile"></div>
					{/if}
				</div>
				<span class="style-label">{style.label}</span>
			</button>
		{/each}
	</div>

	{#if canScrollRight}
		<button
			type="button"
			class="nav-chevron right"
			on:click={() => scroll('right')}
			aria-label="Scroll styles right"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	{/if}
</div>

<style>
	.style-strip-container {
		position: relative;
		width: 100%;
		margin-bottom: var(--spacing-sm);
	}

	.style-strip {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x proximity;
		padding: 4px 4px 6px 4px;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.style-strip::-webkit-scrollbar {
		display: none;
	}

	.style-item {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		scroll-snap-align: start;
		text-align: center;
		width: 68px;
	}

	.tile {
		width: 68px;
		height: 68px;
		border-radius: 10px;
		border: 1px solid var(--color-border);
		box-sizing: border-box;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
		background: var(--bg-surface);
	}

	.style-item:active .tile {
		transform: scale(0.96);
	}

	.none-tile {
		background: #888888;
		color: #ffffff;
	}

	.none-tile :global(svg) {
		color: #ffffff;
	}

	.image-tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.placeholder-tile {
		width: 100%;
		height: 100%;
		background: var(--bg-surface);
	}

	.style-item.selected .tile {
		border: 2.5px solid var(--accent-brand);
		box-shadow: 0 0 0 1px var(--accent-brand);
	}

	.style-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
		line-height: 1.2;
	}

	.style-item.selected .style-label {
		color: var(--accent-brand);
		font-weight: 700;
	}

	.nav-chevron {
		position: absolute;
		top: 36px;
		transform: translateY(-50%);
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--accent-brand);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
		cursor: pointer;
		z-index: 2;
		border: none;
		transition: opacity 0.15s ease, transform 0.15s ease;
	}

	.nav-chevron:hover {
		transform: translateY(-50%) scale(1.08);
	}

	.nav-chevron.left {
		left: 0;
	}

	.nav-chevron.right {
		right: 0;
	}
</style>
