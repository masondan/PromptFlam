<script>
	import { createEventDispatcher } from 'svelte';
	import { formatRelativeTime, getPreviewText, getChatTitle, getChatPreview } from '$lib/utils/formatTime.js';

	export let item;
	export let type = 'chat';
	export let isSelectMode = false;
	export let isSelected = false;

	const dispatch = createEventDispatcher();

	let showToolbar = false;
	let showDeleteConfirm = false;

	$: title = type === 'chat' 
		? getChatTitle(item.messages) 
		: (item.title || 'Untitled Note');
	
	$: preview = type === 'chat'
		? getChatPreview(item.messages)
		: getPreviewText(item.content);
	
	$: timestamp = formatRelativeTime(item.timestamp);

	function handleItemClick() {
		if (isSelectMode) {
			dispatch('toggleSelect', { id: item.id });
		} else if (!showToolbar) {
			dispatch('restore', { item, type });
		}
	}

	function handleMoreClick(e) {
		e.stopPropagation();
		showToolbar = !showToolbar;
		showDeleteConfirm = false;
	}

	function handleCopy(e) {
		e.stopPropagation();
		const text = type === 'chat'
			? item.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
			: `${item.title}\n\n${item.content}`;
		
		navigator.clipboard.writeText(text);
		dispatch('copy', { item });
		closeToolbar();
	}

	async function handleShare(e) {
		e.stopPropagation();
		const text = type === 'chat'
			? item.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
			: `${item.title}\n\n${item.content}`;
		
		if (navigator.share) {
			try {
				await navigator.share({ text });
			} catch (err) {
				if (err.name !== 'AbortError') {
					await navigator.clipboard.writeText(text);
					dispatch('copy', { item });
				}
			}
		} else {
			await navigator.clipboard.writeText(text);
			dispatch('copy', { item });
		}
		closeToolbar();
	}

	function handleDownload(e) {
		e.stopPropagation();
		const text = type === 'chat'
			? item.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
			: `${item.title}\n\n${item.content}`;
		
		const filename = type === 'chat'
			? `chat-${new Date(item.timestamp).toISOString().split('T')[0]}.txt`
			: `${(item.title || 'note').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
		
		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		
		dispatch('download', { item });
		closeToolbar();
	}

	function handleTrashClick(e) {
		e.stopPropagation();
		showDeleteConfirm = true;
	}

	function handleDeleteConfirm(e) {
		e.stopPropagation();
		dispatch('delete', { id: item.id, type });
		closeToolbar();
	}

	function closeToolbar() {
		showToolbar = false;
		showDeleteConfirm = false;
	}

	function handleSelectToggle(e) {
		e.stopPropagation();
		dispatch('toggleSelect', { id: item.id });
	}
</script>

<div 
	class="archive-item" 
	class:select-mode={isSelectMode}
	on:click={handleItemClick}
	on:keydown={(e) => e.key === 'Enter' && handleItemClick()}
	role="button"
	tabindex="0"
>
	{#if isSelectMode}
		<button 
			class="select-button"
			on:click={handleSelectToggle}
			aria-label={isSelected ? 'Deselect item' : 'Select item'}
		>
			<img 
				src={isSelected ? '/icons/icon-radio.svg' : '/icons/icon-circle.svg'}
				alt=""
				class="select-icon"
				class:selected={isSelected}
			/>
		</button>
	{/if}

	<div class="item-content">
		<div class="item-header">
			<h3 class="item-title">{title}</h3>
			
			{#if !isSelectMode}
				<button 
					class="more-button"
					class:active={showToolbar}
					on:click={handleMoreClick}
					aria-label="More options"
				>
					<img src="/icons/icon-more.svg" alt="" class="more-icon" />
				</button>
			{/if}
		</div>

		{#if showToolbar && !isSelectMode}
			<div class="toolbar">
				<button class="toolbar-btn" on:click={handleCopy}>COPY</button>
				<button class="toolbar-btn" on:click={handleShare}>SHARE</button>
				<button class="toolbar-btn" on:click={handleDownload}>DOWNLOAD</button>
				<span class="toolbar-divider"></span>
				<button 
					class="toolbar-trash"
					class:active={showDeleteConfirm}
					on:click={handleTrashClick}
					aria-label="Delete"
				>
					<img src="/icons/icon-trash.svg" alt="" class="trash-icon" />
				</button>
				
				{#if showDeleteConfirm}
					<button class="delete-confirm" on:click={handleDeleteConfirm}>
						DELETE?
					</button>
				{/if}
			</div>
		{/if}

		{#if preview}
			<p class="item-preview">{preview}</p>
		{/if}

		<div class="item-timestamp">
			<img src="/icons/icon-time.svg" alt="" class="time-icon" />
			<span>{timestamp}</span>
		</div>
	</div>
</div>

<style>
	.archive-item {
		display: flex;
		align-items: flex-start;
		padding: var(--spacing-md) 0;
		border-bottom: 1px solid var(--color-separator);
		cursor: pointer;
	}

	.archive-item:hover .item-title {
		color: #5422B0;
	}

	.archive-item.select-mode {
		padding-left: 0;
	}

	.select-button {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: var(--spacing-sm);
		margin-top: var(--spacing-xs);
	}

	.select-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
		transition: opacity 0.15s ease;
	}

	.select-icon.selected {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(27%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(55%) contrast(100%);
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.item-title {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
		flex: 1;
		transition: color 0.15s ease;
	}

	.more-button {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.more-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
		transition: opacity 0.15s ease;
	}

	.more-button:hover .more-icon,
	.more-button.active .more-icon {
		opacity: 1;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		background: var(--bg-surface-dark);
		border-radius: var(--radius-full);
		padding: var(--spacing-xs) var(--spacing-sm);
		margin-top: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		width: fit-content;
	}

	.toolbar-btn {
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-icon-default);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		transition: color 0.15s ease;
	}

	.toolbar-btn:hover {
		color: var(--color-icon-active);
	}

	.toolbar-divider {
		width: 1px;
		height: 16px;
		background: var(--color-separator);
		margin: 0 var(--spacing-xs);
	}

	.toolbar-trash {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
	}

	.trash-icon {
		width: 18px;
		height: 18px;
		opacity: 0.6;
		transition: all 0.15s ease;
	}

	.toolbar-trash:hover .trash-icon {
		opacity: 1;
	}

	.toolbar-trash.active .trash-icon {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(4911%) hue-rotate(264deg) brightness(88%) contrast(98%);
	}

	.delete-confirm {
		background: #5422B0;
		color: white;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-full);
		margin-left: var(--spacing-xs);
	}

	.delete-confirm:hover {
		background: #6a2ed6;
	}

	.item-preview {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: var(--spacing-xs) 0 0 0;
	}

	.item-timestamp {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-sm);
		color: var(--color-icon-default);
		font-size: 0.875rem;
	}

	.time-icon {
		width: 14px;
		height: 14px;
		opacity: 0.6;
	}
</style>
