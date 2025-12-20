<script>
	import { createEventDispatcher } from 'svelte';

	export let isExpanded = false;
	export let fontSizeState = 0; // 0 = default, 1 = medium, 2 = large
	export let isBoldActive = false;
	export let isItalicActive = false;

	const dispatch = createEventDispatcher();

	function toggleExpanded() {
		isExpanded = !isExpanded;
		dispatch('toggle', { expanded: isExpanded });
	}

	function handleFontSize() {
		dispatch('fontsize');
	}

	function handleUndo() {
		dispatch('undo');
	}

	function handleRedo() {
		dispatch('redo');
	}

	function handleList() {
		dispatch('list');
	}

	function handleItalic() {
		dispatch('italic');
	}

	function handleBold() {
		dispatch('bold');
	}

	// Get font size icon color based on state
	$: fontSizeColor = fontSizeState === 0 ? '#999999' : fontSizeState === 1 ? '#777777' : '#555555';
</script>

<div class="toolbar-container">
	{#if isExpanded}
		<div class="toolbar expanded">
			<button 
				class="toolbar-btn close-btn" 
				on:click={toggleExpanded}
				aria-label="Close toolbar"
			>
				<img src="/icons/icon-close.svg" alt="" class="toolbar-icon close-icon" />
			</button>
			
			<button 
				class="toolbar-btn" 
				on:click={handleFontSize}
				aria-label="Change font size"
				style="--icon-color: {fontSizeColor}"
			>
				<img 
					src="/icons/icon-fontsize.svg" 
					alt="" 
					class="toolbar-icon"
					style="filter: brightness(0) saturate(100%) invert({fontSizeState === 0 ? '60%' : fontSizeState === 1 ? '47%' : '33%'});"
				/>
			</button>
			
			<button 
				class="toolbar-btn" 
				on:click={handleUndo}
				aria-label="Undo"
			>
				<img src="/icons/icon-undo.svg" alt="" class="toolbar-icon" />
			</button>
			
			<button 
				class="toolbar-btn" 
				on:click={handleRedo}
				aria-label="Redo"
			>
				<img src="/icons/icon-redo.svg" alt="" class="toolbar-icon" />
			</button>
			
			<button 
				class="toolbar-btn" 
				on:click={handleList}
				aria-label="Bullet list"
			>
				<img src="/icons/icon-list.svg" alt="" class="toolbar-icon" />
			</button>
			
			<button 
				class="toolbar-btn" 
				class:active={isItalicActive}
				on:click={handleItalic}
				aria-label="Italic"
			>
				<img src="/icons/icon-italic.svg" alt="" class="toolbar-icon" />
			</button>
			
			<button 
				class="toolbar-btn" 
				class:active={isBoldActive}
				on:click={handleBold}
				aria-label="Bold"
			>
				<img src="/icons/icon-bold.svg" alt="" class="toolbar-icon" />
			</button>
		</div>
	{:else}
		<button 
			class="more-btn" 
			on:click={toggleExpanded}
			aria-label="Open formatting toolbar"
		>
			<img src="/icons/icon-more.svg" alt="" class="more-icon" />
		</button>
	{/if}
</div>

<style>
	.toolbar-container {
		position: fixed;
		bottom: var(--spacing-md);
		left: var(--spacing-md);
		z-index: var(--z-input-drawer);
	}

	.more-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--bg-surface-dark);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease;
	}

	.more-btn:hover {
		transform: scale(1.05);
	}

	.more-btn:active {
		transform: scale(0.95);
	}

	.more-icon {
		width: 24px;
		height: 24px;
		filter: brightness(0) saturate(100%) invert(15%) sepia(80%) saturate(4500%) hue-rotate(260deg) brightness(90%) contrast(100%);
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		background: var(--bg-surface-dark);
		border-radius: var(--radius-full);
		padding: var(--spacing-xs) var(--spacing-sm);
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.toolbar-btn {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.15s ease;
	}

	.toolbar-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.toolbar-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
	}

	.toolbar-btn.active .toolbar-icon {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(33%);
	}

	.close-btn .close-icon {
		filter: brightness(0) saturate(100%) invert(15%) sepia(80%) saturate(4500%) hue-rotate(260deg) brightness(90%) contrast(100%);
		opacity: 1;
	}
</style>
