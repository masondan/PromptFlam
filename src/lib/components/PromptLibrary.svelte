<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { Icon } from '$lib/components';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { 
		favorites, 
		toggleFavorite, 
		isFavorite,
		promptLibraryCategory,
		promptLibrarySubcategory,
		promptLibraryExpandedId,
		promptLibraryScrollY,
		pendingChatInput
	} from '$lib/stores.js';

	export let mode = 'page';
	
	const dispatch = createEventDispatcher();

	let prompts = [];
	let loading = true;
	let error = '';
	
	let activeTab = 'all';
	let searchQuery = '';
	let categoryDropdownOpen = false;
	let subcategoryDropdownOpen = false;
	let scrollRestored = false;

	const categoryOrder = ['Text', 'Audio', 'Video', 'Social Media', 'Website', 'Strategy', 'Co-pilot', 'Image Gen'];

	$: categories = [...new Set(prompts.map(p => p.category))].sort(
		(a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
	);

	$: subcategories = $promptLibraryCategory === 'all'
		? []
		: [...new Set(prompts.filter(p => p.category === $promptLibraryCategory).map(p => p.subCategory))].sort();

	$: filteredPrompts = filterPrompts(prompts, activeTab, searchQuery, $promptLibraryCategory, $promptLibrarySubcategory, $favorites);

	$: groupedPrompts = groupPrompts(filteredPrompts);

	function filterPrompts(allPrompts, tab, query, category, subcategory, favs) {
		let result = allPrompts;

		if (tab === 'favorites') {
			result = result.filter(p => isFavorite(p.category, p.subCategory, favs));
		}

		if (query.trim()) {
			const q = query.toLowerCase();
			result = result.filter(p =>
				p.task.toLowerCase().includes(q) ||
				p.prompt.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q) ||
				p.subCategory.toLowerCase().includes(q)
			);
		}

		if (category !== 'all') {
			result = result.filter(p => p.category === category);
		}

		if (subcategory !== 'all') {
			result = result.filter(p => p.subCategory === subcategory);
		}

		return result;
	}

	function groupPrompts(promptList) {
		const grouped = {};
		for (const prompt of promptList) {
			if (!grouped[prompt.category]) {
				grouped[prompt.category] = {};
			}
			if (!grouped[prompt.category][prompt.subCategory]) {
				grouped[prompt.category][prompt.subCategory] = [];
			}
			grouped[prompt.category][prompt.subCategory].push(prompt);
		}
		return grouped;
	}

	function stripHtml(html) {
		const temp = document.createElement('div');
		temp.innerHTML = html;
		temp.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
		temp.querySelectorAll('p').forEach(p => p.insertAdjacentText('afterend', '\n'));
		return (temp.innerText || temp.textContent || '').trim();
	}

	function toTitleCase(str) {
		return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
	}

	function handleTabClick(tab) {
		activeTab = tab;
		if (tab === 'favorites' || tab === 'search') {
			promptLibraryCategory.set('all');
			promptLibrarySubcategory.set('all');
		}
		if (tab !== 'search') {
			searchQuery = '';
		}
	}

	function handleCategorySelect(cat) {
		promptLibraryCategory.set(cat);
		promptLibrarySubcategory.set('all');
		categoryDropdownOpen = false;
	}

	function handleSubcategorySelect(sub) {
		promptLibrarySubcategory.set(sub);
		subcategoryDropdownOpen = false;
	}

	function handleFavoriteToggle(category, subCategory) {
		toggleFavorite(category, subCategory);
	}

	function handleCopy(prompt) {
		const text = stripHtml(prompt.prompt);
		navigator.clipboard.writeText(text);
		dispatch('copy', { prompt, text });
	}

	function handleEdit(prompt) {
		const text = stripHtml(prompt.prompt);
		dispatch('edit', { prompt, text });
	}

	function handleInsert(prompt) {
		const text = stripHtml(prompt.prompt);
		dispatch('insert', { prompt: text });
	}

	function handleAddToChat(prompt) {
		const text = stripHtml(prompt.prompt);
		pendingChatInput.set(text);
		goto('/');
	}

	function handleBackToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function togglePromptExpand(promptId) {
		promptLibraryExpandedId.set($promptLibraryExpandedId === promptId ? null : promptId);
	}

	function getPromptId(category, subCategory, task) {
		return `${category}-${subCategory}-${task}`;
	}

	function closeDropdowns(e) {
		if (!e.target.closest('.dropdown')) {
			categoryDropdownOpen = false;
			subcategoryDropdownOpen = false;
		}
	}

	function saveScrollPosition() {
		if (browser) {
			promptLibraryScrollY.set(window.scrollY);
		}
	}

	onMount(async () => {
		try {
			const response = await fetch('/prompts.json');
			if (!response.ok) throw new Error('Failed to load prompts');
			prompts = await response.json();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
			if (browser && $promptLibraryScrollY > 0) {
				requestAnimationFrame(() => {
					window.scrollTo(0, $promptLibraryScrollY);
					scrollRestored = true;
				});
			}
		}

		window.addEventListener('scroll', saveScrollPosition);
		return () => {
			window.removeEventListener('scroll', saveScrollPosition);
		};
	});
</script>

<svelte:window on:click={closeDropdowns} />

<div class="prompt-library">
	<div class="toolbar">
		<div class="dropdown category-dropdown" class:open={categoryDropdownOpen}>
			<button
				class="dropdown-trigger"
				on:click|stopPropagation={() => {
					categoryDropdownOpen = !categoryDropdownOpen;
					subcategoryDropdownOpen = false;
				}}
			>
				<span>{$promptLibraryCategory === 'all' ? 'All Prompts' : $promptLibraryCategory}</span>
				<Icon name={categoryDropdownOpen ? 'collapse' : 'expand'} size={16} />
			</button>
			{#if categoryDropdownOpen}
				<div class="dropdown-menu">
					<button class="dropdown-item" on:click={() => handleCategorySelect('all')}>
						All Prompts
					</button>
					{#each categories as cat}
						<button class="dropdown-item" on:click={() => handleCategorySelect(cat)}>
							{cat}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<button
			class="icon-btn"
			class:active={activeTab === 'search'}
			on:click={() => handleTabClick(activeTab === 'search' ? 'all' : 'search')}
			aria-label="Search"
		>
			<Icon name="search" size={20} />
		</button>
		<button
			class="icon-btn"
			class:active={activeTab === 'favorites'}
			on:click={() => handleTabClick(activeTab === 'favorites' ? 'all' : 'favorites')}
			aria-label="Favourites"
		>
			<Icon name={activeTab === 'favorites' ? 'heart-fill' : 'heart'} size={20} />
		</button>
	</div>

	{#if $promptLibraryCategory !== 'all' && subcategories.length > 0}
		<div class="filters">
			<div class="dropdown subcategory-dropdown" class:open={subcategoryDropdownOpen}>
				<button
					class="dropdown-trigger"
					on:click|stopPropagation={() => {
						subcategoryDropdownOpen = !subcategoryDropdownOpen;
						categoryDropdownOpen = false;
					}}
				>
					<span>{$promptLibrarySubcategory === 'all' ? `All ${$promptLibraryCategory}` : $promptLibrarySubcategory}</span>
					<Icon name={subcategoryDropdownOpen ? 'collapse' : 'expand'} size={16} />
				</button>
				{#if subcategoryDropdownOpen}
					<div class="dropdown-menu">
						<button class="dropdown-item" on:click={() => handleSubcategorySelect('all')}>
							All {$promptLibraryCategory}
						</button>
						{#each subcategories as sub}
							<button class="dropdown-item" on:click={() => handleSubcategorySelect(sub)}>
								{sub}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if activeTab === 'search'}
		<div class="search-bar">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search prompts..."
				class="search-input"
			/>
		</div>
	{/if}

	{#if loading}
		<div class="loading">Loading prompts...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if filteredPrompts.length === 0}
		<div class="empty">No prompts found.</div>
	{:else}
		<div class="prompt-list">
			{#each Object.entries(groupedPrompts) as [category, subcats]}
				<div class="category-group">
					{#each Object.entries(subcats) as [subCategory, tasks]}
						{@const isFav = isFavorite(category, subCategory, $favorites)}
						<div class="subcategory-card">
							<div class="subcategory-header">
								<h2 class="subcategory-title">{subCategory}</h2>
							</div>
							{#each tasks as prompt}
								{@const promptId = getPromptId(category, subCategory, prompt.task)}
								{@const isExpanded = $promptLibraryExpandedId === promptId}
								<div class="task-item">
									<div class="task-header" on:click={() => togglePromptExpand(promptId)}>
										<button class="expand-btn" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
											<Icon name={isExpanded ? 'collapse' : 'expand'} size={16} />
										</button>
									</div>
									<p class="prompt-text" class:collapsed={!isExpanded} on:click={() => togglePromptExpand(promptId)}>{#if prompt.task}<span class="task-label">{toTitleCase(prompt.task)}:</span>{' '}{/if}{stripHtml(prompt.prompt)}</p>
									<div class="action-buttons">
										{#if mode === 'page'}
											<button
												class="action-btn add-to-chat-btn"
												on:click={() => handleAddToChat(prompt)}
												aria-label="Add to chat"
											>
												<Icon name="create" size={20} />
											</button>
											<button
												class="action-btn"
												on:click={() => handleEdit(prompt)}
												aria-label="Edit prompt"
											>
												<Icon name="edit" size={20} />
											</button>
										{:else}
											<button
												class="action-btn insert-btn"
												on:click={() => handleInsert(prompt)}
												aria-label="Insert into chat"
											>
												<Icon name="create" size={20} />
											</button>
										{/if}
										<button
											class="action-btn"
											on:click={() => handleCopy(prompt)}
											aria-label="Copy prompt"
										>
											<Icon name="copy" size={20} />
										</button>
										<button
											class="action-btn favorite-btn"
											class:active={isFav}
											on:click={() => handleFavoriteToggle(category, subCategory)}
											aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
										>
											<Icon name={isFav ? 'heart-fill' : 'heart'} size={20} />
										</button>
										<button
											class="action-btn"
											on:click={handleBackToTop}
											aria-label="Back to top"
										>
											<Icon name="arrow-up" size={20} />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.prompt-library {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.toolbar {
		display: flex;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.icon-btn {
		flex-shrink: 0;
		width: 46px;
		height: 46px;
		padding: 0.65rem;
		background: #fff;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		color: #999999;
	}

	.icon-btn:hover {
		background: #f5f5f5;
	}

	.icon-btn.active {
		background: #EFEFEF;
		border-color: var(--color-border);
		color: var(--accent-brand);
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 1rem;
		background: #fff;
	}

	.search-input:focus {
		border-color: var(--color-border);
		outline: none;
	}

	.filters {
		display: flex;
		gap: var(--spacing-sm);
	}

	.dropdown {
		position: relative;
	}

	.category-dropdown {
		flex: 1;
		min-width: 0;
	}

	.subcategory-dropdown {
		width: 100%;
	}

	.dropdown-trigger {
		width: 100%;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 1rem;
		color: var(--text-primary);
		text-align: left;
		cursor: pointer;
	}

	.dropdown-trigger :global(svg) {
		color: #777777;
	}

	.dropdown-trigger:hover {
		background: var(--color-highlight);
	}

	.dropdown.open .dropdown-trigger {
		border-color: var(--color-border);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: #fff;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		z-index: 99;
		max-height: 75vh;
		overflow-y: auto;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.75rem;
		text-align: left;
		font-size: 1rem;
		color: var(--text-primary);
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
		background: none;
		border-left: none;
		border-right: none;
		border-top: none;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background: var(--color-highlight);
	}

	.loading,
	.error,
	.empty {
		padding: var(--spacing-xl);
		text-align: center;
		color: var(--text-secondary);
	}

	.error {
		color: #dc2626;
	}

	.prompt-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		margin-top: var(--spacing-md);
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.subcategory-card {
		background: var(--bg-main);
		padding: 0;
	}

	.subcategory-header {
		margin-bottom: var(--spacing-md);
	}

	.subcategory-title {
		font-size: var(--font-size-h2);
		font-weight: 600;
		color: #5422B0;
		margin: 0;
		padding-bottom: var(--spacing-xs);
		border-bottom: 2px solid #5422B0;
		display: inline-block;
	}

	.task-item {
		padding: var(--spacing-md) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.task-header {
		display: flex;
		justify-content: flex-end;
		align-items: flex-start;
		cursor: pointer;
		float: right;
		margin-left: var(--spacing-sm);
	}

	.task-label {
		font-weight: 600;
		color: #777777;
	}

	.expand-btn {
		color: #777777;
		padding: var(--spacing-xs);
		flex-shrink: 0;
	}

	.expand-btn:hover {
		color: var(--accent-brand);
	}

	.prompt-text {
		color: var(--text-primary);
		white-space: pre-wrap;
		margin: 0 0 var(--spacing-md) 0;
		line-height: 1.6;
		cursor: pointer;
	}

	.prompt-text.collapsed {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: var(--spacing-md);
	}

	.action-btn {
		color: var(--color-icon-default);
		padding: var(--spacing-xs);
		transition: color 0.15s, transform 0.15s;
	}

	.action-btn:hover {
		color: var(--color-icon-active);
		transform: scale(1.1);
	}

	.action-btn.insert-btn {
		color: var(--accent-brand);
	}

	.action-btn.favorite-btn.active {
		color: var(--accent-brand);
	}

	.action-btn.favorite-btn.active:hover {
		color: var(--accent-brand);
	}
</style>
