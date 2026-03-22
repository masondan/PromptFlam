<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { Icon } from '$lib/components';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { 
		favorites, 
		toggleFavorite, 
		isFavorite,
		promptLibraryCategory,
		promptLibraryScrollY,
		pendingChatInput,
		personaRole,
		personaAudience
	} from '$lib/stores.js';

	export let mode = 'page';
	export let onProfileClick = () => {};
	
	const dispatch = createEventDispatcher();

	let prompts = [];
	let loading = true;
	let error = '';
	
	let activeTab = 'all';
	let searchQuery = '';
	let categoryDropdownOpen = false;

	const categoryOrder = ['Ideas', 'Text', 'Data', 'Audio', 'Video', 'Social media', 'Image', 'AI Co-pilot', 'Website', 'Strategy'];

	$: categories = [...new Set(prompts.map(p => p.category))].sort(
		(a, b) => {
			const ai = categoryOrder.indexOf(a);
			const bi = categoryOrder.indexOf(b);
			return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
		}
	);

	$: filteredPrompts = filterPrompts(prompts, activeTab, searchQuery, $promptLibraryCategory, $favorites);
	
	$: groupedByCategory = groupPromptsByCategory(filteredPrompts);

	function filterPrompts(allPrompts, tab, query, category, favs) {
		let result = allPrompts;

		if (tab === 'favorites') {
			result = result.filter(p => isFavorite(p.category, p.subCategory, favs));
		}

		if (query.trim()) {
			const q = query.toLowerCase();
			result = result.filter(p =>
				p.prompt.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q) ||
				p.subCategory.toLowerCase().includes(q)
			);
		}

		if (category !== 'all') {
			result = result.filter(p => p.category === category);
		}

		return result;
	}

	function groupPromptsByCategory(promptList) {
		const grouped = {};
		for (const prompt of promptList) {
			if (!grouped[prompt.category]) {
				grouped[prompt.category] = [];
			}
			// Only add one entry per subCategory (since there's now one prompt per subcategory)
			if (!grouped[prompt.category].find(p => p.subCategory === prompt.subCategory)) {
				grouped[prompt.category].push(prompt);
			}
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

	function applyPersonaSubstitutions(text) {
		let result = text;
		if ($personaRole) {
			result = result.replace(/\[role\]/g, $personaRole);
		}
		if ($personaAudience) {
			result = result.replace(/\[who, where\]/g, $personaAudience);
		}
		return result;
	}

	function handleTabClick(tab) {
		activeTab = tab;
		if (tab === 'favorites') {
			promptLibraryCategory.set('all');
		}
		if (tab !== 'search') {
			searchQuery = '';
		}
	}

	function handleCategorySelect(cat) {
		promptLibraryCategory.set(cat);
		categoryDropdownOpen = false;
		if (activeTab === 'search') {
			activeTab = 'all';
			searchQuery = '';
		}
	}

	function handleCardClick(prompt) {
		const text = applyPersonaSubstitutions(stripHtml(prompt.prompt));
		dispatch('edit', { prompt, text });
	}

	function handleCopy(prompt) {
		const text = applyPersonaSubstitutions(stripHtml(prompt.prompt));
		
		let textToCopy = text;
		if (prompt.styleGuideIncluded) {
			textToCopy += '\n\nBefore responding, read and apply the editorial style guide at: ' + window.location.origin + '/style-guide';
		}
		
		navigator.clipboard.writeText(textToCopy);
		dispatch('copy', { prompt, text });
	}

	function handleAddToChat(prompt) {
		const text = applyPersonaSubstitutions(stripHtml(prompt.prompt));
		pendingChatInput.set(text);
		goto('/create');
	}

	function handleInsert(prompt) {
		const text = applyPersonaSubstitutions(stripHtml(prompt.prompt));
		dispatch('insert', { prompt: text });
	}

	function closeDropdowns(e) {
		if (!e.target.closest('.dropdown')) {
			categoryDropdownOpen = false;
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
	<!-- Toolbar: matches original design -->
	<div class="toolbar">
		<div class="dropdown category-dropdown" class:open={categoryDropdownOpen}>
			<button
				class="dropdown-trigger"
				on:click|stopPropagation={() => {
					categoryDropdownOpen = !categoryDropdownOpen;
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
						{@const isCoreCategory = ['Ideas', 'Text', 'Data', 'Audio', 'Video', 'Social media'].includes(cat)}
						<button class="dropdown-item" class:core-category={isCoreCategory} on:click={() => handleCategorySelect(cat)}>
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
			<Icon name="search" size={22} />
		</button>
		<button
			class="icon-btn"
			class:active={activeTab === 'favorites'}
			on:click={() => handleTabClick(activeTab === 'favorites' ? 'all' : 'favorites')}
			aria-label="Favourites"
		>
			<Icon name={activeTab === 'favorites' ? 'heart-fill' : 'heart'} size={22} />
		</button>
		<button
			class="icon-btn profile-btn"
			on:click={onProfileClick}
			aria-label="Persona settings"
		>
			<Icon name="user" size={22} />
		</button>
	</div>

	<!-- Search bar (visible when search tab active) -->
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

	<!-- Content -->
	{#if loading}
		<div class="loading">Loading prompts...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if Object.keys(groupedByCategory).length === 0}
		<div class="empty">No prompts found.</div>
	{:else}
		<div class="prompt-list">
			{#each Object.entries(groupedByCategory) as [category, promptList]}
				<div class="category-section">
					<h2 class="category-title">{category}</h2>

					<div class="card-list">
						{#each promptList as prompt}
							{@const isFav = isFavorite(category, prompt.subCategory, $favorites)}
							<button
								class="prompt-card"
								on:click={() => handleCardClick(prompt)}
							>
								<span class="card-label">{prompt.subCategory}</span>
								{#if isFav}
									<span class="fav-heart">
										<Icon name="heart-fill" size={22} />
									</span>
								{/if}
							</button>
						{/each}
					</div>
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

	/* Toolbar */
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
		border: 1px solid #555555;
		border-radius: var(--radius);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		color: #555555;
	}

	.icon-btn:hover {
		background: #f5f5f5;
	}

	.icon-btn.active {
		background: #EFEFEF;
		border-color: var(--color-border);
		color: var(--accent-brand);
	}

	.icon-btn.profile-btn {
		color: var(--color-icon-default);
	}

	.icon-btn.profile-btn:hover {
		color: var(--color-icon-active);
	}

	/* Dropdown */
	.dropdown {
		position: relative;
	}

	.category-dropdown {
		flex: 1;
		min-width: 0;
	}

	.category-dropdown .dropdown-trigger {
		background: var(--accent-brand);
		border-color: var(--accent-brand);
		color: #ffffff;
	}

	.category-dropdown .dropdown-trigger :global(svg) {
		color: #ffffff;
	}

	.category-dropdown .dropdown-trigger:hover {
		background: #6a2ed6;
		border-color: #6a2ed6;
	}

	.dropdown-trigger {
		width: 100%;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid #555555;
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
		border: 1px solid #555555;
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
		border-bottom: 1px solid #555555;
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

	.dropdown-item.core-category {
		font-weight: 700;
	}

	/* Search */
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

	/* Loading / Error / Empty */
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

	/* Prompt list */
	.prompt-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		margin-top: var(--spacing-sm);
	}

	.category-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.category-title {
		font-size: var(--font-size-h2);
		font-weight: 700;
		color: var(--accent-brand);
		margin: 0;
		padding-bottom: var(--spacing-xs);
		border-bottom: 2px solid #d4c4f0;
	}

	/* Subcategory cards */
	.card-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.prompt-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: var(--spacing-md) var(--spacing-md);
		background: #f2f2f2;
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
		text-align: left;
	}

	.prompt-card:hover {
		background: var(--color-highlight);
		border-color: #d4c4f0;
	}

	.card-label {
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.fav-heart {
		display: flex;
		align-items: center;
		color: var(--accent-brand);
	}
</style>
