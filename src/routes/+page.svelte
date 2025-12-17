<script>
	// Create page - AI chat interface (Phase 2 will add full functionality)
	import { Icon } from '$lib/components';
</script>

<main class="page">
	<h1>Create</h1>
	<p>AI chat interface will be built in Phase 2.</p>
	
	<section class="icon-test">
		<h2>Icon System Test</h2>
		<div class="icons">
			<span><Icon name="create" /> create</span>
			<span><Icon name="prompts" /> prompts</span>
			<span><Icon name="edit" /> edit</span>
			<span><Icon name="archive" /> archive</span>
			<span><Icon name="send" /> send</span>
			<span><Icon name="close" /> close</span>
		</div>
		<p><em>If icons appear above, the icon system is working correctly.</em></p>
	</section>
</main>

<style>
	.page {
		padding: var(--spacing-lg);
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: var(--spacing-md);
	}

	.icon-test {
		margin-top: var(--spacing-xl);
		padding: var(--spacing-md);
		background: var(--color-surface);
		border-radius: var(--radius-md);
	}

	.icon-test h2 {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
	}

	.icons {
		display: flex;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
	}

	.icons span {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}
</style>
