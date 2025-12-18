<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { Icon } from '$lib/components';
	import { favorites, toggleFavorite, isFavorite } from '$lib/stores.js';

	export let mode = 'page';
	
	const dispatch = createEventDispatcher();

	let prompts = [];
	let loading = true;
	let error = '';
	
	let activeTab = 'all';
	let searchQuery = '';
	let selectedCategory = 'all';
	let selectedSubcategory = 'all';
	let categoryDropdownOpen = false;
	let subcategoryDropdownOpen = false;

	const categoryOrder = ['Text', 'Audio', 'Video', 'Social Media', 'Website', 'Strategy', 'Co-pilot', 'Image Gen'];

	$: categories = [...new Set(prompts.map(p => p.category))].sort(
		(a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
	);

	$: subcategories = selectedCategory === 'all'
		? []
		: [...new Set(prompts.filter(p => p.category === selectedCategory).map(p => p.subCategory))].sort();

	$: filteredPrompts = filterPrompts(prompts, activeTab, searchQuery, selectedCategory, selectedSubcategory, $favorites);

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

	function handleTabClick(tab) {
		activeTab = tab;
		if (tab === 'favorites') {
			selectedCategory = 'all';
			selectedSubcategory = 'all';
		}
		if (tab !== 'search') {
			searchQuery = '';
		}
	}

	function handleCategorySelect(cat) {
		selectedCategory = cat;
		selectedSubcategory = 'all';
		categoryDropdownOpen = false;
	}

	function handleSubcategorySelect(sub) {
		selectedSubcategory = sub;
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

	function handleBackToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function closeDropdowns(e) {
		if (!e.target.closest('.dropdown')) {
			categoryDropdownOpen = false;
			subcategoryDropdownOpen = false;
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
		}
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
				<span>{selectedCategory === 'all' ? 'All Prompts' : selectedCategory}</span>
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

	{#if selectedCategory !== 'all' && subcategories.length > 0}
		<div class="filters">
			<div class="dropdown subcategory-dropdown" class:open={subcategoryDropdownOpen}>
				<button
					class="dropdown-trigger"
					on:click|stopPropagation={() => {
						subcategoryDropdownOpen = !subcategoryDropdownOpen;
						categoryDropdownOpen = false;
					}}
				>
					<span>{selectedSubcategory === 'all' ? `All ${selectedCategory}` : selectedSubcategory}</span>
					<Icon name={subcategoryDropdownOpen ? 'collapse' : 'expand'} size={16} />
				</button>
				{#if subcategoryDropdownOpen}
					<div class="dropdown-menu">
						<button class="dropdown-item" on:click={() => handleSubcategorySelect('all')}>
							All {selectedCategory}
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
					<h2 class="category-title">{category}</h2>
					{#each Object.entries(subcats) as [subCategory, tasks]}
						{@const isFav = isFavorite(category, subCategory, $favorites)}
						<div class="subcategory-card">
							<div class="subcategory-header">
								<h3 class="subcategory-title">{subCategory}</h3>
								<button
									class="favorite-btn"
									class:active={isFav}
									on:click={() => handleFavoriteToggle(category, subCategory)}
									aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
								>
									<Icon name={isFav ? 'heart-fill' : 'heart'} size={24} />
								</button>
							</div>
							{#each tasks as prompt}
								<div class="task-item">
									{#if prompt.task}
										<strong class="task-label">{prompt.task}</strong>
									{/if}
									<p class="prompt-text">{stripHtml(prompt.prompt)}</p>
									<div class="action-buttons">
										{#if mode === 'page'}
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
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
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
		background: #DC143C;
		border-color: #DC143C;
		color: #ffffff;
	}

	.search-bar {
		margin-top: var(--spacing-sm);
	}

	.search-input {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
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
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 1rem;
		color: var(--color-text);
		text-align: left;
		cursor: pointer;
	}

	.dropdown-trigger:hover {
		background: #f5f5f5;
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
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
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
		color: var(--color-text);
		border-bottom: 1px solid var(--color-border-light);
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
		background: #f0f0f0;
	}

	.loading,
	.error,
	.empty {
		padding: var(--spacing-xl);
		text-align: center;
		color: var(--color-text-muted);
	}

	.error {
		color: #dc2626;
	}

	.prompt-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.category-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.category-title {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--color-text-secondary);
		text-align: center;
		margin: 0;
	}

	.subcategory-card {
		background: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
	}

	.subcategory-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
		margin-bottom: var(--spacing-md);
	}

	.subcategory-title {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.favorite-btn {
		color: var(--color-icon-default);
		padding: var(--spacing-xs);
		transition: color 0.15s, transform 0.15s;
	}

	.favorite-btn:hover {
		transform: scale(1.1);
	}

	.favorite-btn.active {
		color: #DC143C;
	}

	.task-item {
		padding: var(--spacing-sm) 0;
	}

	.task-item + .task-item {
		border-top: 1px solid var(--color-border-light);
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-md);
	}

	.task-label {
		display: block;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--spacing-xs);
	}

	.prompt-text {
		color: var(--color-text-secondary);
		white-space: pre-wrap;
		margin: 0 0 var(--spacing-md) 0;
		line-height: 1.6;
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
		color: var(--color-primary);
	}
</style>
