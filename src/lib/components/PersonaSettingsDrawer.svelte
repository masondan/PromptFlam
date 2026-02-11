<script>
	import { createEventDispatcher } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { personaRole, personaAudience } from '$lib/stores.js';

	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let localRole = '';
	let localAudience = '';

	$: if (isOpen) {
		localRole = $personaRole;
		localAudience = $personaAudience;
	}

	function handleCancel() {
		dispatch('close');
	}

	function handleSave() {
		personaRole.set(localRole);
		personaAudience.set(localAudience);
		dispatch('close');
		dispatch('saved');
	}

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div 
		class="overlay" 
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-label="Persona Settings"
		tabindex="0"
		transition:fade={{ duration: 150 }}
	>
		<div class="drawer" transition:fly={{ y: '100%', duration: 250 }}>
			<div class="content-area">
				<p class="description">
					This pre-fills the 'act as a [role]' and 'audience of [who, where]' sections.
				</p>

				<div class="input-group">
					<label class="input-label" for="persona-role">Role</label>
					<input
						id="persona-role"
						type="text"
						class="text-input"
						placeholder="Act as a …"
						bind:value={localRole}
					/>
				</div>

				<div class="input-group">
					<label class="input-label" for="persona-audience">Audience</label>
					<input
						id="persona-audience"
						type="text"
						class="text-input"
						placeholder="Define your audience"
						bind:value={localAudience}
					/>
				</div>

				<div class="button-row">
					<button class="action-btn" on:click={handleCancel}>Cancel</button>
					<button class="action-btn" on:click={handleSave}>Save</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: var(--z-overlay);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	@media (min-width: 768px) {
		.overlay {
			left: 50%;
			transform: translateX(-50%);
			width: var(--app-max-width);
		}
	}

	.drawer {
		width: 100%;
		max-width: var(--app-max-width);
		background: var(--bg-main);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: var(--spacing-lg);
		padding-bottom: var(--spacing-xl);
	}

	.content-area {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.description {
		color: #777777;
		font-size: 0.9375rem;
		margin: 0;
		line-height: var(--line-height);
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.input-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.text-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.9375rem;
		background: #fff;
		color: var(--text-primary);
	}

	.text-input:focus {
		outline: none;
		border-color: var(--color-border);
	}

	.text-input::placeholder {
		color: #999999;
		font-size: 0.9375rem;
	}

	.button-row {
		display: flex;
		justify-content: space-between;
		margin-top: var(--spacing-sm);
	}

	.action-btn {
		padding: 0.5625rem 1.25rem;
		border: 1px solid #777777;
		border-radius: var(--radius);
		font-size: 0.9375rem;
		color: #777777;
		background: transparent;
		transition: border-color 0.15s, color 0.15s;
		height: 38px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-btn:hover,
	.action-btn:active {
		border-color: var(--accent-brand);
		color: var(--accent-brand);
	}
</style>
