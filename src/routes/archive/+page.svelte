<script>
	import { goto } from '$app/navigation';
	import { Header, ArchiveItem } from '$lib/components';
	import { archiveChats, archiveNotes, chatMessages, currentChatSessionId, restoreNote } from '$lib/stores';

	let activeTab = 'chats';
	let isSelectMode = false;
	let selectedIds = new Set();
	let showBulkDeleteConfirm = false;

	$: items = activeTab === 'chats' ? $archiveChats : $archiveNotes;
	$: hasItems = items.length > 0;
	$: hasSelection = selectedIds.size > 0;

	function switchTab(tab) {
		activeTab = tab;
		exitSelectMode();
	}

	function toggleSelectMode() {
		if (isSelectMode) {
			exitSelectMode();
		} else {
			isSelectMode = true;
			selectedIds = new Set();
			showBulkDeleteConfirm = false;
		}
	}

	function exitSelectMode() {
		isSelectMode = false;
		selectedIds = new Set();
		showBulkDeleteConfirm = false;
	}

	function handleToggleSelect(e) {
		const { id } = e.detail;
		const newSelection = new Set(selectedIds);
		
		if (newSelection.has(id)) {
			newSelection.delete(id);
		} else {
			newSelection.add(id);
		}
		
		selectedIds = newSelection;
		showBulkDeleteConfirm = false;
	}

	function handleRestore(e) {
		const { item, type } = e.detail;
		
		if (type === 'chat') {
			chatMessages.set(item.messages);
			currentChatSessionId.set(item.id);
			goto('/');
		} else {
			restoreNote(item);
			goto('/notepad');
		}
	}

	function handleDelete(e) {
		const { id, type } = e.detail;
		
		if (type === 'chat') {
			archiveChats.update(chats => chats.filter(c => c.id !== id));
		} else {
			archiveNotes.update(notes => notes.filter(n => n.id !== id));
		}
	}

	function handleCopy() {
		// Could show a toast notification here
	}

	function handleDownload() {
		// Could show a toast notification here
	}

	function handleBulkTrashClick() {
		if (hasSelection) {
			showBulkDeleteConfirm = true;
		}
	}

	function handleBulkDeleteConfirm() {
		const idsToDelete = Array.from(selectedIds);
		
		if (activeTab === 'chats') {
			archiveChats.update(chats => 
				chats.filter(c => !idsToDelete.includes(c.id))
			);
		} else {
			archiveNotes.update(notes => 
				notes.filter(n => !idsToDelete.includes(n.id))
			);
		}
		
		exitSelectMode();
	}
</script>

<svelte:head>
	<title>Archive | PromptFlam</title>
</svelte:head>

<Header />

<main class="archive-page">
	<div class="tab-row">
		<div class="tabs">
			<button 
				class="tab"
				class:active={activeTab === 'chats'}
				on:click={() => switchTab('chats')}
			>
				Chats
			</button>
			<button 
				class="tab"
				class:active={activeTab === 'notes'}
				on:click={() => switchTab('notes')}
			>
				Notes
			</button>
		</div>

		<div class="tab-actions">
			{#if isSelectMode && hasSelection}
				<div class="bulk-delete-container">
					{#if showBulkDeleteConfirm}
						<button class="bulk-delete-confirm" on:click={handleBulkDeleteConfirm}>
							DELETE?
						</button>
					{/if}
					<button 
						class="bulk-trash-btn"
						class:active={showBulkDeleteConfirm}
						on:click={handleBulkTrashClick}
						aria-label="Delete selected items"
					>
						<img src="/icons/icon-trash.svg" alt="" class="bulk-trash-icon" />
					</button>
				</div>
			{/if}
			
			<button 
				class="select-all-btn"
				class:active={isSelectMode}
				on:click={toggleSelectMode}
				aria-label={isSelectMode ? 'Exit select mode' : 'Select items'}
			>
				<img 
					src={isSelectMode ? '/icons/icon-select-all-fill.svg' : '/icons/icon-select-all.svg'} 
					alt="" 
					class="select-all-icon" 
				/>
			</button>
		</div>
	</div>

	<div class="archive-list">
		{#if hasItems}
			{#each items as item (item.id)}
				<ArchiveItem 
					{item}
					type={activeTab === 'chats' ? 'chat' : 'note'}
					{isSelectMode}
					isSelected={selectedIds.has(item.id)}
					on:toggleSelect={handleToggleSelect}
					on:restore={handleRestore}
					on:delete={handleDelete}
					on:copy={handleCopy}
					on:download={handleDownload}
				/>
			{/each}
		{:else}
			<div class="empty-state">
				<p>
					{activeTab === 'chats' 
						? 'No saved chats yet' 
						: 'No saved notes yet'}
				</p>
				<p class="empty-hint">
					{activeTab === 'chats'
						? 'Your chat conversations will appear here automatically.'
						: 'Notes you create will appear here automatically.'}
				</p>
			</div>
		{/if}
	</div>
</main>

<style>
	.archive-page {
		min-height: 100vh;
		padding-top: var(--spacing-md);
		max-width: var(--max-content-width);
		margin: 0 auto;
	}

	.tab-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--spacing-md) var(--spacing-sm);
	}

	.tabs {
		display: flex;
		gap: var(--spacing-lg);
	}

	.tab {
		font-size: var(--font-size-h2);
		font-weight: 600;
		color: #777777;
		padding-bottom: var(--spacing-xs);
		border-bottom: 2px solid transparent;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.tab:hover {
		color: var(--color-icon-active);
	}

	.tab.active {
		color: var(--color-icon-active);
		border-bottom-color: var(--color-icon-active);
	}

	.tab-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding-bottom: var(--spacing-xs);
	}

	.bulk-delete-container {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.bulk-trash-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: background-color 0.15s ease;
	}

	.bulk-trash-btn:hover {
		background-color: var(--bg-surface-dark);
	}

	.bulk-trash-icon {
		width: 20px;
		height: 20px;
		filter: brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(4911%) hue-rotate(264deg) brightness(88%) contrast(98%);
	}

	.bulk-delete-confirm {
		background: #5422B0;
		color: white;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-full);
	}

	.bulk-delete-confirm:hover {
		background: #6a2ed6;
	}

	.select-all-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: background-color 0.15s ease;
	}

	.select-all-btn:hover {
		background-color: var(--bg-surface-dark);
	}

	.select-all-icon {
		width: 20px;
		height: 20px;
		opacity: 0.6;
		transition: opacity 0.15s ease, filter 0.15s ease;
	}

	.select-all-btn:hover .select-all-icon {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(4911%) hue-rotate(264deg) brightness(88%) contrast(98%);
	}

	.select-all-btn.active .select-all-icon {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(18%) sepia(95%) saturate(4911%) hue-rotate(264deg) brightness(88%) contrast(98%);
	}

	.archive-list {
		padding: 0 var(--spacing-md);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-xl) var(--spacing-md);
		text-align: center;
		min-height: 300px;
	}

	.empty-state p {
		color: var(--text-secondary);
		font-size: var(--font-size-h3);
		margin: 0;
	}

	.empty-hint {
		color: var(--color-icon-default);
		font-size: 0.875rem !important;
		margin-top: var(--spacing-sm) !important;
	}
</style>
