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
	let copyTapped = false;
	let shareTapped = false;
	let downloadTapped = false;
	let trashTapped = false;

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
		copyTapped = true;
		setTimeout(() => {
			const text = type === 'chat'
				? item.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')
				: `${item.title}\n\n${item.content}`;
			
			navigator.clipboard.writeText(text);
			dispatch('copy', { item });
			copyTapped = false;
			closeToolbar();
		}, 150);
	}

	async function handleShare(e) {
		e.stopPropagation();
		shareTapped = true;
		setTimeout(async () => {
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
			shareTapped = false;
			closeToolbar();
		}, 150);
	}

	function handleDownload(e) {
		e.stopPropagation();
		downloadTapped = true;
		setTimeout(() => {
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
			downloadTapped = false;
			closeToolbar();
		}, 150);
	}

	function handleTrashClick(e) {
		e.stopPropagation();
		trashTapped = true;
		setTimeout(() => {
			if (showDeleteConfirm) {
				dispatch('delete', { id: item.id, type });
				trashTapped = false;
				closeToolbar();
			} else {
				showDeleteConfirm = true;
				trashTapped = false;
			}
		}, 150);
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
			<div class="toolbar-wrapper">
				<div class="toolbar">
					{#if showDeleteConfirm}
						<button class="delete-confirm" on:click={handleDeleteConfirm}>Delete?</button>
					{/if}
					<button 
						class="toolbar-trash"
						class:tapped={trashTapped}
						on:click={handleTrashClick}
						aria-label="Delete"
					>
						<img src="/icons/icon-trash.svg" alt="" class="trash-icon" />
					</button>
					<span class="toolbar-divider"></span>
					<button class="toolbar-btn" class:tapped={copyTapped} on:click={handleCopy}>Copy</button>
					<span class="toolbar-divider"></span>
					<button class="toolbar-btn" class:tapped={shareTapped} on:click={handleShare}>Share</button>
					<span class="toolbar-divider"></span>
					<button class="toolbar-btn" class:tapped={downloadTapped} on:click={handleDownload}>Download</button>
				</div>
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
		transition: filter 0.15s ease;
		filter: brightness(0) saturate(100%) invert(47%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
	}

	.select-icon.selected {
		filter: brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(4911%) hue-rotate(264deg) brightness(88%) contrast(98%);
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

	.toolbar-wrapper {
		display: flex;
		justify-content: flex-end;
		margin-top: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.toolbar {
		display: flex;
		align-items: center;
		background: var(--accent-brand);
		border-radius: var(--radius-full);
		padding: var(--spacing-xs) var(--spacing-sm);
		gap: 0;
	}

	.toolbar-btn {
		font-size: 14px;
		font-weight: 400;
		color: #ffffff;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: transform 0.15s ease;
		white-space: nowrap;
	}

	.toolbar-btn:hover {
		transform: scale(1.05);
	}

	.toolbar-btn.tapped {
		transform: scale(1.15);
	}

	.toolbar-divider {
		width: 1px;
		height: 16px;
		background: rgba(255, 255, 255, 0.4);
	}

	.toolbar-trash {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xs);
		border-radius: var(--radius-sm);
		transition: transform 0.15s ease;
	}

	.toolbar-trash:hover {
		transform: scale(1.05);
	}

	.toolbar-trash.tapped {
		transform: scale(1.15);
	}

	.trash-icon {
		width: 18px;
		height: 18px;
		filter: brightness(0) invert(1);
	}

	.delete-confirm {
		font-size: 14px;
		font-weight: 400;
		color: #ffffff;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: transform 0.15s ease;
		white-space: nowrap;
	}

	.delete-confirm:hover {
		transform: scale(1.05);
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
